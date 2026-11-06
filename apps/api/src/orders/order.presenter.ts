import { Prisma } from '@prisma/client';

export const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
  payments: { orderBy: { id: 'asc' } },
  history: { orderBy: { id: 'asc' } },
  promotion: { select: { code: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function presentOrder(o: OrderWithRelations) {
  return {
    id: o.id,
    code: `#${o.id}`,
    status: o.status,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    promoCode: o.promotion?.code ?? null,
    pointsEarned: o.pointsEarned,
    note: o.note,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      size: i.size,
      toppings: i.toppings,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amount: p.amount,
      transactionRef: p.transactionRef,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
    })),
    history: o.history.map((h) => ({ from: h.fromStatus, to: h.toStatus, reason: h.reason, at: h.createdAt })),
  };
}

export type OrderResponse = ReturnType<typeof presentOrder>;
