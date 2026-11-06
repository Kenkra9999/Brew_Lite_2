import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { DomainError, NotFoundError } from '../common/domain-error';
import { LoyaltyService } from '../loyalty/loyalty';
import { ORDER_INCLUDE, presentOrder } from '../orders/order.presenter';
import { isPayable } from '../orders/order-state-machine';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, IDEMPOTENCY_KEY_PATTERN } from './dto/create-payment.dto';
import { ChargeResult, MockPaymentGateway } from './mock-payment.gateway';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface PaymentOutcome {
  replayed: boolean;
  payment: {
    id: number;
    status: PaymentStatus;
    method: Payment['method'];
    amount: number;
    transactionRef: string | null;
    failureReason: string | null;
    createdAt: Date;
  };
  order: ReturnType<typeof presentOrder>;
}

/**
 * POST /payments - thanh toán IDEMPOTENT (Task 8 + Task 10.2, ADR-004).
 *
 * 1. Nếu Idempotency-Key đã tồn tại  => trả lại đúng kết quả cũ (replay), không gọi cổng lần 2.
 * 2. Ngược lại, trong transaction: khóa dòng Order (SELECT ... FOR UPDATE), kiểm tra đơn còn
 *    thanh toán được, tạo Payment(PROCESSING) với UNIQUE(idempotencyKey).
 *    Hai request đồng thời cùng key => request thua dính lỗi P2002 và chờ kết quả của request thắng.
 * 3. Gọi cổng thanh toán (ngoài transaction để không giữ khóa khi chờ mạng).
 * 4. Transaction thứ hai: cập nhật Payment, chuyển trạng thái đơn qua state machine
 *    (PENDING -> PAID | PAYMENT_FAILED) và cộng điểm thưởng khi PAID.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly loyalty: LoyaltyService,
    private readonly gateway: MockPaymentGateway,
  ) {}

  static requestHash(userId: number, dto: Pick<CreatePaymentDto, 'orderId' | 'method'>): string {
    return createHash('sha256').update(`${userId}|${dto.orderId}|${dto.method}`).digest('hex');
  }

  async pay(userId: number, idempotencyKey: string | undefined, dto: CreatePaymentDto): Promise<PaymentOutcome> {
    if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new DomainError(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Thiếu hoặc sai định dạng header Idempotency-Key (8-128 ký tự [A-Za-z0-9_-])',
        HttpStatus.BAD_REQUEST,
      );
    }
    const requestHash = PaymentsService.requestHash(userId, dto);

    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing) return this.replay(existing, requestHash);

    let payment: Payment;
    let replayAfterLock = false;
    try {
      payment = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${dto.orderId} FOR UPDATE`;
        // A second request may have waited for the first claim transaction.
        // Recheck the key before checking the new order state or in-flight payment.
        const claimed = await tx.payment.findUnique({ where: { idempotencyKey } });
        if (claimed) {
          replayAfterLock = true;
          return claimed;
        }
        let order = await this.orders.getRef(tx, dto.orderId);
        if (order.userId !== userId) throw new NotFoundError('Order', dto.orderId);
        if (!isPayable(order.status)) {
          throw new DomainError(
            order.status === OrderStatus.PAID ? 'ORDER_ALREADY_PAID' : 'ORDER_NOT_PAYABLE',
            `Đơn #${order.id} đang ở trạng thái ${order.status}, không thể thanh toán`,
            HttpStatus.CONFLICT,
          );
        }
        const inFlight = await tx.payment.findFirst({ where: { orderId: order.id, status: PaymentStatus.PROCESSING } });
        if (inFlight) {
          throw new DomainError('PAYMENT_IN_PROGRESS', 'Đơn đang được thanh toán, vui lòng chờ', HttpStatus.CONFLICT);
        }
        if (order.status === OrderStatus.PAYMENT_FAILED) {
          order = await this.orders.transition(tx, order, OrderStatus.PENDING, 'Khách thử thanh toán lại');
        }
        return tx.payment.create({
          data: { orderId: order.id, idempotencyKey, requestHash, amount: order.total, method: dto.method },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // Request đồng thời cùng Idempotency-Key đã tạo Payment trước => chờ và trả kết quả đó
        const winner = await this.prisma.payment.findUniqueOrThrow({ where: { idempotencyKey } });
        return this.replay(winner, requestHash);
      }
      throw e;
    }

    if (replayAfterLock) return this.replay(payment, requestHash);

    let result: ChargeResult;
    try {
      result = await this.gateway.charge({
        idempotencyKey,
        amount: payment.amount,
        method: dto.method,
        cardNumber: dto.cardNumber,
      });
    } catch (err) {
      this.logger.error(`Gateway error for payment ${payment.id}: ${(err as Error).message}`);
      result = { success: false, transactionRef: null, failureReason: 'GATEWAY_UNAVAILABLE' };
    }

    // Retry finalization using the already obtained gateway result, never charge again.
    for (let attempt = 0; ; attempt++) {
      try {
        await this.finalize(payment, result);
        break;
      } catch (err) {
        const transient = err instanceof Prisma.PrismaClientKnownRequestError && ['P2028', 'P2034'].includes(err.code);
        if (!transient || attempt >= 2) throw err;
        await sleep(100 * (attempt + 1));
      }
    }
    this.logger.log(`Payment ${payment.id} order=${payment.orderId} ${result.success ? 'SUCCEEDED' : 'FAILED'}`);
    return this.outcome(payment.id, false);
  }

  private async finalize(payment: Payment, result: ChargeResult): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${payment.orderId} FOR UPDATE`;
      const order = await this.orders.getRef(tx, payment.orderId);
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PROCESSING },
        data: {
          status: result.success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          transactionRef: result.transactionRef,
          failureReason: result.failureReason,
        },
      });
      if (count === 0) return;
      if (result.success) {
        const paid = await this.orders.transition(tx, order, OrderStatus.PAID, `Thanh toán ${payment.method} thành công`);
        await this.loyalty.awardForOrder(tx, paid);
      } else {
        await this.orders.transition(tx, order, OrderStatus.PAYMENT_FAILED, `Thanh toán thất bại: ${result.failureReason}`);
      }
    });
  }

  private async replay(existing: Payment, requestHash: string): Promise<PaymentOutcome> {
    if (existing.requestHash !== requestHash) {
      throw new DomainError(
        'IDEMPOTENCY_KEY_REUSED',
        'Idempotency-Key đã được dùng cho một yêu cầu thanh toán khác',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    let current = existing;
    for (let i = 0; i < 50 && current.status === PaymentStatus.PROCESSING; i++) {
      await sleep(100);
      current = await this.prisma.payment.findUniqueOrThrow({ where: { id: existing.id } });
    }
    if (current.status === PaymentStatus.PROCESSING) {
      throw new DomainError('PAYMENT_IN_PROGRESS', 'Thanh toán đang được xử lý, vui lòng thử lại sau', HttpStatus.CONFLICT);
    }
    return this.outcome(current.id, true);
  }

  private async outcome(paymentId: number, replayed: boolean): Promise<PaymentOutcome> {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: p.orderId }, include: ORDER_INCLUDE });
    return {
      replayed,
      payment: {
        id: p.id,
        status: p.status,
        method: p.method,
        amount: p.amount,
        transactionRef: p.transactionRef,
        failureReason: p.failureReason,
        createdAt: p.createdAt,
      },
      order: presentOrder(order),
    };
  }
}
