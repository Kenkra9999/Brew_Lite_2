import { evaluatePromotion, PromotionLike } from './promotion-rules';

const base: PromotionLike = {
  code: 'WELCOME10',
  type: 'PERCENT',
  value: 10,
  minOrderAmount: 50_000,
  maxDiscount: 20_000,
  usageLimit: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
};
const now = new Date('2026-11-06T08:00:00Z');

describe('Promotion rules (UNIT-T03 - Task 10.4)', () => {
  it('giảm theo phần trăm', () => {
    expect(evaluatePromotion(base, 120_000, now)).toEqual({ ok: true, discount: 12_000 });
  });

  it('giảm phần trăm bị chặn bởi maxDiscount', () => {
    expect(evaluatePromotion(base, 500_000, now)).toEqual({ ok: true, discount: 20_000 });
  });

  it('giảm cố định không vượt quá tạm tính', () => {
    const fixed: PromotionLike = { ...base, type: 'FIXED', value: 15_000, minOrderAmount: 0, maxDiscount: null };
    expect(evaluatePromotion(fixed, 100_000, now)).toEqual({ ok: true, discount: 15_000 });
    expect(evaluatePromotion(fixed, 10_000, now)).toEqual({ ok: true, discount: 10_000 });
  });

  it.each<[string, Partial<PromotionLike>, number, string]>([
    ['mã đã tắt', { isActive: false }, 100_000, 'INACTIVE'],
    ['chưa đến ngày', { startsAt: new Date('2026-12-01') }, 100_000, 'NOT_STARTED'],
    ['hết hạn', { endsAt: new Date('2026-01-01') }, 100_000, 'EXPIRED'],
    ['hết lượt', { usageLimit: 5, usedCount: 5 }, 100_000, 'USAGE_LIMIT_REACHED'],
    ['chưa đạt giá trị tối thiểu', {}, 49_999, 'MIN_ORDER_NOT_MET'],
  ])('từ chối khi %s', (_label, patch, subtotal, reason) => {
    const result = evaluatePromotion({ ...base, ...patch }, subtotal, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });
});
