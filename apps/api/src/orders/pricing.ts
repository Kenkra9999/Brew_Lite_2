/**
 * Quy tắc tính giá (pure functions, dùng chung cho tạo đơn và kiểm thử).
 * Server luôn tự tính lại giá - KHÔNG tin giá do client gửi lên (NFR bảo mật).
 */
export type SizeCode = 'S' | 'M' | 'L';

/** Phụ phí theo size so với giá size S (VND). */
export const SIZE_SURCHARGE: Readonly<Record<SizeCode, number>> = { S: 0, M: 5_000, L: 10_000 };

export const MAX_QTY_PER_LINE = 20;
export const MAX_TOPPINGS_PER_ITEM = 3;

export interface PricedTopping {
  id: number;
  name: string;
  price: number;
}

export function unitPrice(basePrice: number, size: SizeCode, toppings: readonly PricedTopping[] = []): number {
  if (!Number.isInteger(basePrice) || basePrice < 0) throw new RangeError('basePrice must be a non-negative integer');
  const surcharge = SIZE_SURCHARGE[size];
  if (surcharge === undefined) throw new RangeError(`Unknown size ${size}`);
  return basePrice + surcharge + toppings.reduce((sum, t) => sum + t.price, 0);
}

export function lineTotal(unit: number, qty: number): number {
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
    throw new RangeError(`qty must be an integer in [1, ${MAX_QTY_PER_LINE}]`);
  }
  return unit * qty;
}

export function subtotalOf(lines: readonly { lineTotal: number }[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}

/** Gộp số lượng theo productId để kiểm tra/trừ tồn kho một lần cho mỗi sản phẩm. */
export function quantityByProduct(items: readonly { productId: number; qty: number }[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const i of items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.qty);
  return map;
}
