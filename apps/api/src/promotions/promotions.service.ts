import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, Promotion } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import { evaluatePromotion } from './promotion-rules';

type Tx = Prisma.TransactionClient;

export const normalizeCode = (code: string) => code.trim().toUpperCase();

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { code: true, description: true, type: true, value: true, minOrderAmount: true, maxDiscount: true },
      orderBy: { id: 'asc' },
    });
  }

  /** Xem trước số tiền giảm (không giữ lượt dùng). */
  async preview(code: string, subtotal: number) {
    const promo = await this.findOrThrow(this.prisma, code);
    const result = evaluatePromotion(promo, subtotal);
    if (!result.ok) throw new DomainError(`PROMO_${result.reason}`, result.message, HttpStatus.UNPROCESSABLE_ENTITY);
    return { code: promo.code, description: promo.description, discount: result.discount, total: subtotal - result.discount };
  }

  /**
   * Áp mã trong transaction tạo đơn: kiểm tra quy tắc rồi tăng usedCount có điều kiện
   * (UPDATE ... WHERE usedCount < usageLimit) để không vượt giới hạn khi nhiều đơn dùng cùng lúc.
   */
  async applyInTransaction(tx: Tx, code: string, subtotal: number): Promise<{ promotion: Promotion; discount: number }> {
    const promo = await this.findOrThrow(tx, code);
    const result = evaluatePromotion(promo, subtotal);
    if (!result.ok) throw new DomainError(`PROMO_${result.reason}`, result.message, HttpStatus.UNPROCESSABLE_ENTITY);
    const reserved = await tx.$executeRaw`
      UPDATE "Promotion" SET "usedCount" = "usedCount" + 1
      WHERE "id" = ${promo.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
    if (reserved === 0) {
      throw new DomainError('PROMO_USAGE_LIMIT_REACHED', `Mã ${promo.code} đã hết lượt sử dụng`, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { promotion: promo, discount: result.discount };
  }

  /** Trả lại lượt dùng khi đơn bị hủy. */
  async releaseInTransaction(tx: Tx, promotionId: number) {
    await tx.$executeRaw`UPDATE "Promotion" SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE "id" = ${promotionId}`;
  }

  private async findOrThrow(client: Tx | PrismaService, code: string) {
    const promo = await client.promotion.findUnique({ where: { code: normalizeCode(code) } });
    if (!promo) throw new DomainError('PROMO_NOT_FOUND', `Mã khuyến mãi "${code}" không tồn tại`, HttpStatus.UNPROCESSABLE_ENTITY);
    return promo;
  }
}
