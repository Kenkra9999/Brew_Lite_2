import { lineTotal, quantityByProduct, SIZE_SURCHARGE, subtotalOf, unitPrice } from './pricing';

describe('Pricing (UNIT-T02 - FR-03/FR-05)', () => {
  const pearl = { id: 1, name: 'Trân châu', price: 5_000 };
  const cheese = { id: 2, name: 'Kem cheese', price: 8_000 };

  it('size S giữ nguyên giá gốc, M +5.000đ, L +10.000đ', () => {
    expect(unitPrice(45_000, 'S')).toBe(45_000);
    expect(unitPrice(45_000, 'M')).toBe(50_000);
    expect(unitPrice(45_000, 'L')).toBe(55_000);
    expect(SIZE_SURCHARGE).toEqual({ S: 0, M: 5_000, L: 10_000 });
  });

  it('cộng giá topping vào đơn giá', () => {
    expect(unitPrice(39_000, 'L', [pearl, cheese])).toBe(39_000 + 10_000 + 5_000 + 8_000);
  });

  it('thành tiền = đơn giá × số lượng', () => {
    expect(lineTotal(50_000, 3)).toBe(150_000);
  });

  it.each([0, -1, 21, 1.5])('từ chối số lượng không hợp lệ (%p)', (qty) => {
    expect(() => lineTotal(50_000, qty)).toThrow(RangeError);
  });

  it('từ chối giá âm hoặc size lạ', () => {
    expect(() => unitPrice(-1, 'S')).toThrow(RangeError);
    expect(() => unitPrice(10_000, 'XL' as never)).toThrow(RangeError);
  });

  it('tổng tạm tính là tổng các dòng (ví dụ wireframe 123.000đ)', () => {
    // Cappuccino S x1 (45.000) + Trà đào S x2 (2 × 39.000)
    const lines = [{ lineTotal: lineTotal(unitPrice(45_000, 'S'), 1) }, { lineTotal: lineTotal(unitPrice(39_000, 'S'), 2) }];
    expect(subtotalOf(lines)).toBe(123_000);
    expect(subtotalOf([])).toBe(0);
  });

  it('gộp số lượng theo sản phẩm để trừ tồn kho một lần', () => {
    const map = quantityByProduct([
      { productId: 1, qty: 2 },
      { productId: 2, qty: 1 },
      { productId: 1, qty: 3 },
    ]);
    expect([...map.entries()]).toEqual([
      [1, 5],
      [2, 1],
    ]);
  });
});
