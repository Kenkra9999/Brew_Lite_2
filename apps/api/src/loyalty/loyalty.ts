import { Injectable } from '@nestjs/common';
import { LoyaltyType, Prisma } from '@prisma/client';

/** 1 điểm cho mỗi 10.000đ thực trả (Task 10.4). */
export const VND_PER_POINT = 10_000;

export function pointsForAmount(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor(total / VND_PER_POINT);
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class LoyaltyService {
  /**
   * Cộng điểm sau khi đơn PAID. Ràng buộc UNIQUE(orderId, type) đảm bảo mỗi đơn
   * chỉ được cộng điểm một lần kể cả khi xử lý lặp lại.
   */
  async awardForOrder(tx: Tx, order: { id: number; userId: number; total: number }): Promise<number> {
    const points = pointsForAmount(order.total);
    if (points === 0) return 0;
    const existing = await tx.loyaltyTransaction.findUnique({
      where: { orderId_type: { orderId: order.id, type: LoyaltyType.EARN } },
    });
    if (existing) return existing.points;
    await tx.loyaltyTransaction.create({
      data: { userId: order.userId, orderId: order.id, type: LoyaltyType.EARN, points },
    });
    await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: points } } });
    await tx.order.update({ where: { id: order.id }, data: { pointsEarned: points } });
    return points;
  }

  /** Thu hồi điểm khi đơn đã PAID bị hủy. */
  async revertForOrder(tx: Tx, order: { id: number; userId: number }) {
    const earned = await tx.loyaltyTransaction.findUnique({
      where: { orderId_type: { orderId: order.id, type: LoyaltyType.EARN } },
    });
    if (!earned) return 0;
    const reverted = await tx.loyaltyTransaction.findUnique({
      where: { orderId_type: { orderId: order.id, type: LoyaltyType.REVERT } },
    });
    if (reverted) return 0;
    await tx.loyaltyTransaction.create({
      data: { userId: order.userId, orderId: order.id, type: LoyaltyType.REVERT, points: -earned.points },
    });
    await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { decrement: earned.points } } });
    return earned.points;
  }
}
