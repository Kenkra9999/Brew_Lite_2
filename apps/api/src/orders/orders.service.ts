import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { DomainError, NotFoundError, OptimisticLockError, OutOfStockError } from '../common/domain-error';
import { LoyaltyService } from '../loyalty/loyalty';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import type { AuthUser } from '../auth/auth.service';
import { CreateOrderDto } from './dto/order.dto';
import { ORDER_INCLUDE, presentOrder } from './order.presenter';
import { assertTransition, STAFF_TARGET_STATUSES } from './order-state-machine';
import { lineTotal, quantityByProduct, subtotalOf, unitPrice } from './pricing';

type Tx = Prisma.TransactionClient;
export interface OrderRef {
  id: number;
  userId: number;
  status: OrderStatus;
  version: number;
  total: number;
  promotionId: number | null;
}

/** Số lần thử lại khi xung đột optimistic lock (version không khớp). */
export const MAX_CREATE_ATTEMPTS = 8;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (e: unknown) =>
  e instanceof OptimisticLockError ||
  (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034'); // write conflict / deadlock

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promotions: PromotionsService,
    private readonly loyalty: LoyaltyService,
  ) {}

  /**
   * FR-12 / Task 6 + Task 10.3: tạo đơn PENDING.
   * Toàn bộ (đọc giá, trừ tồn kho, áp mã, ghi đơn) chạy trong MỘT transaction.
   * Tồn kho trừ bằng optimistic locking: UPDATE ... WHERE version = :v AND stock >= :qty;
   * nếu 0 dòng bị ảnh hưởng => có giao dịch khác vừa cập nhật => rollback và thử lại.
   */
  async create(userId: number, dto: CreateOrderDto) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => this.createInTx(tx, userId, dto), {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 10_000,
          timeout: 15_000,
        });
      } catch (e) {
        if (isRetryable(e) && attempt < MAX_CREATE_ATTEMPTS) {
          this.logger.debug(`Optimistic lock conflict, retry #${attempt}`);
          await sleep(10 * attempt + Math.floor(Math.random() * 25)); // backoff + jitter
          continue;
        }
        throw e;
      }
    }
  }

  private async createInTx(tx: Tx, userId: number, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))].sort((a, b) => a - b);
    const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const id of productIds) if (!productById.has(id)) throw new NotFoundError('Product', id);

    const toppingIds = [...new Set(dto.items.flatMap((i) => i.toppingIds ?? []))];
    const toppings = toppingIds.length
      ? await tx.topping.findMany({ where: { id: { in: toppingIds }, isActive: true } })
      : [];
    const toppingById = new Map(toppings.map((t) => [t.id, { id: t.id, name: t.name, price: t.price }]));
    const missingTopping = toppingIds.find((id) => !toppingById.has(id));
    if (missingTopping !== undefined) {
      throw new DomainError('INVALID_TOPPING', `Topping #${missingTopping} không hợp lệ`, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // Server tự tính giá từ CSDL (không dùng giá client gửi)
    const lines = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const chosen = (item.toppingIds ?? []).map((id) => toppingById.get(id)!);
      const unit = unitPrice(product.price, item.size, chosen);
      return {
        productId: product.id,
        productName: product.name,
        size: item.size,
        toppings: chosen,
        qty: item.qty,
        unitPrice: unit,
        lineTotal: lineTotal(unit, item.qty),
      };
    });

    // Trừ tồn kho theo thứ tự id tăng dần (tránh deadlock) với optimistic locking
    const qtyByProduct = quantityByProduct(dto.items);
    for (const productId of productIds) {
      const product = productById.get(productId)!;
      const qty = qtyByProduct.get(productId)!;
      if (product.stock < qty) throw new OutOfStockError(product.name, product.stock);
      const { count } = await tx.product.updateMany({
        where: { id: productId, version: product.version, stock: { gte: qty } },
        data: { stock: { decrement: qty }, version: { increment: 1 } },
      });
      if (count === 0) throw new OptimisticLockError('Product');
    }

    const subtotal = subtotalOf(lines);
    let discount = 0;
    let promotionId: number | null = null;
    if (dto.promoCode?.trim()) {
      const applied = await this.promotions.applyInTransaction(tx, dto.promoCode, subtotal);
      discount = applied.discount;
      promotionId = applied.promotion.id;
    }

    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        discount,
        total: subtotal - discount,
        promotionId,
        note: dto.note?.trim() || null,
        items: { create: lines },
        history: { create: { fromStatus: null, toStatus: OrderStatus.PENDING, reason: 'Tạo đơn hàng' } },
      },
      include: ORDER_INCLUDE,
    });
    return presentOrder(order);
  }

  /** FR-16: lịch sử đơn của người dùng hiện tại. */
  async findMine(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return orders.map(presentOrder);
  }

  async findOneFor(user: AuthUser, id: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order || (order.userId !== user.id && user.role !== Role.STAFF)) throw new NotFoundError('Order', id);
    return presentOrder(order);
  }

  /** Bảng điều phối của barista (phần mở rộng). */
  async listForStaff(statuses: OrderStatus[]) {
    const orders = await this.prisma.order.findMany({
      where: statuses.length ? { status: { in: statuses } } : {},
      include: { ...ORDER_INCLUDE, user: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return orders.map((o) => ({ ...presentOrder(o), customerName: o.user.fullName }));
  }

  /** Khách tự hủy đơn chưa thanh toán. Đơn đã PAID phải do nhân viên hủy (hoàn tiền). */
  async cancelByCustomer(userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`;
      const order = await this.getRef(tx, id);
      if (order.userId !== userId) throw new NotFoundError('Order', id);
      if (order.status === OrderStatus.PAID) {
        throw new DomainError('CANCEL_NOT_ALLOWED', 'Đơn đã thanh toán, vui lòng liên hệ quầy để hủy', HttpStatus.CONFLICT);
      }
      const inFlight = await tx.payment.count({ where: { orderId: id, status: 'PROCESSING' } });
      if (inFlight > 0) {
        throw new DomainError('PAYMENT_IN_PROGRESS', 'Đơn đang được thanh toán, không thể hủy lúc này', HttpStatus.CONFLICT);
      }
      await this.transition(tx, order, OrderStatus.CANCELLED, 'Khách hủy đơn');
      return presentOrder(await tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE }));
    });
  }

  /** PATCH /orders/:id/status - nhân viên cập nhật trạng thái pha chế. */
  async updateStatusByStaff(id: number, to: OrderStatus) {
    if (!STAFF_TARGET_STATUSES.includes(to)) {
      throw new DomainError(
        'STATUS_NOT_ALLOWED',
        `Nhân viên không thể đặt trạng thái ${to} thủ công (PAID/PAYMENT_FAILED do cổng thanh toán quyết định)`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`;
      const order = await this.getRef(tx, id);
      const inFlight = await tx.payment.count({ where: { orderId: id, status: 'PROCESSING' } });
      if (inFlight > 0) {
        throw new DomainError('PAYMENT_IN_PROGRESS', 'Đơn đang được thanh toán', HttpStatus.CONFLICT);
      }
      await this.transition(tx, order, to, to === OrderStatus.CANCELLED ? 'Nhân viên hủy đơn (hoàn tiền mô phỏng)' : undefined);
      return presentOrder(await tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE }));
    });
  }

  async getRef(tx: Tx, id: number): Promise<OrderRef> {
    const order = await tx.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, version: true, total: true, promotionId: true },
    });
    if (!order) throw new NotFoundError('Order', id);
    return order;
  }

  /**
   * Điểm DUY NHẤT thay đổi trạng thái đơn: kiểm tra state machine + optimistic lock trên đơn,
   * ghi lịch sử và xử lý tác động phụ (hoàn tồn kho / trả lượt mã / thu hồi điểm khi hủy).
   */
  async transition(tx: Tx, order: OrderRef, to: OrderStatus, reason?: string): Promise<OrderRef> {
    assertTransition(order.status, to);
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: order.status, version: order.version },
      data: { status: to, version: { increment: 1 } },
    });
    if (count === 0) throw new OptimisticLockError('Order');
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: to, reason: reason ?? null },
    });

    if (to === OrderStatus.CANCELLED) {
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const [productId, qty] of quantityByProduct(items)) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: qty }, version: { increment: 1 } },
        });
      }
      if (order.promotionId) await this.promotions.releaseInTransaction(tx, order.promotionId);
      if (order.status === OrderStatus.PAID) await this.loyalty.revertForOrder(tx, order);
    }
    return { ...order, status: to, version: order.version + 1 };
  }
}
