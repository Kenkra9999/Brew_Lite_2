/** Quy tắc áp mã khuyến mãi (Task 10.4) - pure function để unit test. */
export type DiscountKind = 'PERCENT' | 'FIXED';

export interface PromotionLike {
  code: string;
  type: DiscountKind;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export type PromotionRejectReason = 'INACTIVE' | 'NOT_STARTED' | 'EXPIRED' | 'USAGE_LIMIT_REACHED' | 'MIN_ORDER_NOT_MET';

export type PromotionResult =
  | { ok: true; discount: number }
  | { ok: false; reason: PromotionRejectReason; message: string };

const fmt = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export function evaluatePromotion(promo: PromotionLike, subtotal: number, now: Date = new Date()): PromotionResult {
  if (!promo.isActive) return { ok: false, reason: 'INACTIVE', message: `Mã ${promo.code} đã ngừng áp dụng` };
  if (promo.startsAt && now < promo.startsAt)
    return { ok: false, reason: 'NOT_STARTED', message: `Mã ${promo.code} chưa đến thời gian áp dụng` };
  if (promo.endsAt && now > promo.endsAt) return { ok: false, reason: 'EXPIRED', message: `Mã ${promo.code} đã hết hạn` };
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
    return { ok: false, reason: 'USAGE_LIMIT_REACHED', message: `Mã ${promo.code} đã hết lượt sử dụng` };
  if (subtotal < promo.minOrderAmount)
    return {
      ok: false,
      reason: 'MIN_ORDER_NOT_MET',
      message: `Mã ${promo.code} áp dụng cho đơn từ ${fmt(promo.minOrderAmount)}`,
    };

  let discount = promo.type === 'PERCENT' ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  if (promo.maxDiscount !== null) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.max(0, Math.min(discount, subtotal)); // không bao giờ làm tổng tiền âm
  return { ok: true, discount };
}
