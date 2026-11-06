import { DiscountType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/** Dữ liệu mẫu (idempotent - chạy nhiều lần không nhân bản dữ liệu). */
export const SEED_PRODUCTS = [
  { name: 'Cà phê sữa', category: 'Cà phê', price: 35_000, stock: 100, imageUrl: '/images/ca-phe-sua.svg', description: 'Cà phê phin Robusta pha cùng sữa đặc, đậm vị Sài Gòn.' },
  { name: 'Americano', category: 'Cà phê', price: 40_000, stock: 100, imageUrl: '/images/americano.svg', description: 'Espresso pha loãng với nước nóng, vị thanh, hậu vị đắng nhẹ.' },
  { name: 'Cappuccino', category: 'Cà phê', price: 45_000, stock: 80, imageUrl: '/images/cappuccino.svg', description: 'Espresso, sữa nóng và lớp bọt sữa mịn phủ bột cacao.' },
  { name: 'Bạc xỉu', category: 'Cà phê', price: 39_000, stock: 80, imageUrl: '/images/bac-xiu.svg', description: 'Nhiều sữa, ít cà phê - ngọt ngào và béo nhẹ.' },
  { name: 'Trà đào cam sả', category: 'Trà', price: 39_000, stock: 60, imageUrl: '/images/tra-dao.svg', description: 'Trà đen ủ lạnh với đào miếng, cam tươi và sả thơm.' },
  { name: 'Trà sữa matcha', category: 'Trà', price: 45_000, stock: 50, imageUrl: '/images/matcha.svg', description: 'Matcha Uji pha sữa tươi, vị chát dịu.' },
  { name: 'Sinh tố bơ', category: 'Đá xay', price: 49_000, stock: 30, imageUrl: '/images/sinh-to-bo.svg', description: 'Bơ sáp Đắk Lắk xay cùng sữa, béo ngậy.' },
  { name: 'Cold Brew cam', category: 'Cà phê', price: 52_000, stock: 5, imageUrl: '/images/cold-brew.svg', description: 'Cold brew 16 giờ kết hợp nước cam ép - số lượng giới hạn mỗi ngày.' },
];

export const SEED_TOPPINGS = [
  { name: 'Trân châu', price: 5_000 },
  { name: 'Kem cheese', price: 8_000 },
  { name: 'Thạch cà phê', price: 6_000 },
  { name: 'Thêm shot espresso', price: 10_000 },
];

export const DEMO_USERS = [
  { email: 'demo@brewlite.vn', password: 'Demo@1234', fullName: 'Khách Demo', role: Role.CUSTOMER },
  { email: 'barista@brewlite.vn', password: 'Barista@1234', fullName: 'Barista Quầy 1', role: Role.STAFF },
];

export async function seed(prisma: PrismaClient) {
  for (const p of SEED_PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) await prisma.product.update({ where: { id: existing.id }, data: { ...p } });
    else await prisma.product.create({ data: p });
  }
  for (const t of SEED_TOPPINGS) {
    await prisma.topping.upsert({ where: { name: t.name }, update: { price: t.price }, create: t });
  }
  const promotions = [
    { code: 'WELCOME10', description: 'Giảm 10% cho đơn từ 50.000đ (tối đa 20.000đ)', type: DiscountType.PERCENT, value: 10, minOrderAmount: 50_000, maxDiscount: 20_000, usageLimit: null, endsAt: null },
    { code: 'GIAM15K', description: 'Giảm 15.000đ cho đơn từ 100.000đ', type: DiscountType.FIXED, value: 15_000, minOrderAmount: 100_000, maxDiscount: null, usageLimit: 500, endsAt: null },
    { code: 'HETHAN', description: 'Mã đã hết hạn (dùng để demo)', type: DiscountType.PERCENT, value: 50, minOrderAmount: 0, maxDiscount: null, usageLimit: null, endsAt: new Date('2025-01-01T00:00:00Z') },
  ];
  for (const promo of promotions) {
    await prisma.promotion.upsert({ where: { code: promo.code }, update: promo, create: promo });
  }
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, fullName: u.fullName },
      create: { email: u.email, passwordHash, fullName: u.fullName, role: u.role },
    });
  }
}
