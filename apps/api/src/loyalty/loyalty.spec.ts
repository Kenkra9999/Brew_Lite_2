import { pointsForAmount, VND_PER_POINT } from './loyalty';

describe('Loyalty points (UNIT-T05 - Task 10.4)', () => {
  it('1 điểm cho mỗi 10.000đ, làm tròn xuống', () => {
    expect(VND_PER_POINT).toBe(10_000);
    expect(pointsForAmount(123_000)).toBe(12);
    expect(pointsForAmount(9_999)).toBe(0);
    expect(pointsForAmount(10_000)).toBe(1);
  });

  it('không cộng điểm cho số tiền không hợp lệ', () => {
    expect(pointsForAmount(0)).toBe(0);
    expect(pointsForAmount(-50_000)).toBe(0);
    expect(pointsForAmount(Number.NaN)).toBe(0);
  });
});
