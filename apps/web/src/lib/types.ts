export type Size = 'S' | 'M' | 'L';
export type Topping = { id: number; name: string; price: number };
export type Product = { id: number; name: string; description: string; category: string; price: number; imageUrl: string; stock: number; available: boolean; sizes?: {size: Size; price: number; surcharge: number}[]; toppings?: Topping[] };
export type User = { id: number; email: string; fullName: string; role: 'CUSTOMER' | 'STAFF'; loyaltyPoints: number };
export type Order = { id: number; code: string; status: string; subtotal: number; discount: number; total: number; pointsEarned: number; createdAt: string; note?: string; customerName?: string; items: { id: number; productName: string; size: Size; qty: number; lineTotal: number; toppings: Topping[] }[]; history: { from: string | null; to: string; reason: string; at: string }[] };
export const money = (v: number) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(v);
export const statusLabel: Record<string,string> = {PENDING:'Chờ thanh toán', PAID:'Đã thanh toán', PAYMENT_FAILED:'Thanh toán thất bại', PREPARING:'Đang pha chế', READY:'Sẵn sàng nhận', COMPLETED:'Đã hoàn tất', CANCELLED:'Đã hủy'};
