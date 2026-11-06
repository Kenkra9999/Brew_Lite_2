import {
  bearer,
  createTestApp,
  loginStaff,
  newKey,
  productByName,
  registerUser,
  resetDatabase,
  TestContext,
} from './helpers';

describe('Orders API (INT-T01..T09)', () => {
  let ctx: TestContext;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    ({ token } = await registerUser(ctx));
  });
  afterAll(() => ctx.app.close());

  const createOrder = (body: object, t = token) => ctx.http().post('/orders').set(bearer(t)).send(body);

  it('INT-T01 tạo đơn cần đăng nhập (JWT guard)', async () => {
    await ctx.http().post('/orders').send({ items: [] }).expect(401);
  });

  it('INT-T02 validate body: giỏ trống, size sai, qty 0, gửi kèm giá => 400', async () => {
    const p = await productByName(ctx.prisma, 'Americano');
    await createOrder({ items: [] }).expect(400);
    await createOrder({ items: [{ productId: p.id, size: 'XL', qty: 1 }] }).expect(400);
    await createOrder({ items: [{ productId: p.id, size: 'M', qty: 0 }] }).expect(400);
    // client không được phép gửi giá => bị từ chối (forbidNonWhitelisted)
    await createOrder({ items: [{ productId: p.id, size: 'M', qty: 1, unitPrice: 1 }] }).expect(400);
  });

  it('INT-T03 tạo đơn PENDING, server tự tính giá theo size + topping và trừ tồn kho', async () => {
    const cap = await productByName(ctx.prisma, 'Cappuccino');
    const tea = await productByName(ctx.prisma, 'Trà đào cam sả');
    const pearl = await ctx.prisma.topping.findUniqueOrThrow({ where: { name: 'Trân châu' } });
    const res = await createOrder({
      items: [
        { productId: cap.id, size: 'M', qty: 1 },
        { productId: tea.id, size: 'L', qty: 2, toppingIds: [pearl.id] },
      ],
      note: 'Ít đá',
    }).expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.code).toMatch(/^#\d+$/);
    expect(res.body.items[0]).toEqual(expect.objectContaining({ unitPrice: 50_000, lineTotal: 50_000 }));
    expect(res.body.items[1]).toEqual(expect.objectContaining({ unitPrice: 54_000, lineTotal: 108_000 }));
    expect(res.body.subtotal).toBe(158_000);
    expect(res.body.total).toBe(158_000);
    expect(res.body.history).toEqual([expect.objectContaining({ from: null, to: 'PENDING' })]);

    expect((await productByName(ctx.prisma, 'Cappuccino')).stock).toBe(cap.stock - 1);
    expect((await productByName(ctx.prisma, 'Trà đào cam sả')).stock).toBe(tea.stock - 2);
  });

  it('INT-T04 áp mã khuyến mãi hợp lệ, từ chối mã hết hạn / không tồn tại', async () => {
    const cap = await productByName(ctx.prisma, 'Cappuccino');
    const ok = await createOrder({ items: [{ productId: cap.id, size: 'L', qty: 2 }], promoCode: 'welcome10' }).expect(201);
    expect(ok.body).toEqual(expect.objectContaining({ subtotal: 110_000, discount: 11_000, total: 99_000, promoCode: 'WELCOME10' }));

    const expired = await createOrder({ items: [{ productId: cap.id, size: 'S', qty: 1 }], promoCode: 'HETHAN' }).expect(422);
    expect(expired.body.code).toBe('PROMO_EXPIRED');
    const missing = await createOrder({ items: [{ productId: cap.id, size: 'S', qty: 1 }], promoCode: 'KHONGCO' }).expect(422);
    expect(missing.body.code).toBe('PROMO_NOT_FOUND');

    const preview = await ctx.http().post('/promotions/validate').send({ code: 'GIAM15K', subtotal: 120_000 }).expect(200);
    expect(preview.body).toEqual(expect.objectContaining({ discount: 15_000, total: 105_000 }));
  });

  it('INT-T05 hết hàng => 409 OUT_OF_STOCK, tồn kho giữ nguyên', async () => {
    const cold = await productByName(ctx.prisma, 'Cold Brew cam');
    const res = await createOrder({ items: [{ productId: cold.id, size: 'S', qty: cold.stock + 1 }] }).expect(409);
    expect(res.body.code).toBe('OUT_OF_STOCK');
    expect((await productByName(ctx.prisma, 'Cold Brew cam')).stock).toBe(cold.stock);
  });

  it('INT-T06 lịch sử đơn chỉ chứa đơn của chính người dùng; không xem được đơn người khác', async () => {
    const other = await registerUser(ctx);
    const p = await productByName(ctx.prisma, 'Bạc xỉu');
    const otherOrder = await createOrder({ items: [{ productId: p.id, size: 'S', qty: 1 }] }, other.token).expect(201);

    const mine = await ctx.http().get('/orders/me').set(bearer(token)).expect(200);
    expect(mine.body.length).toBeGreaterThanOrEqual(2);
    expect(mine.body.map((o: { id: number }) => o.id)).not.toContain(otherOrder.body.id);
    await ctx.http().get(`/orders/${otherOrder.body.id}`).set(bearer(token)).expect(404);
  });

  it('INT-T07 (Task 10a) API chặn chuyển trạng thái sai và cho phép luồng hợp lệ', async () => {
    const staff = await loginStaff(ctx);
    const p = await productByName(ctx.prisma, 'Americano');
    const order = (await createOrder({ items: [{ productId: p.id, size: 'S', qty: 1 }] }).expect(201)).body;

    // Khách hàng không có quyền đổi trạng thái
    await ctx.http().patch(`/orders/${order.id}/status`).set(bearer(token)).send({ status: 'PREPARING' }).expect(403);

    // PENDING -> PREPARING (chưa thanh toán) bị chặn
    const bad = await ctx.http().patch(`/orders/${order.id}/status`).set(bearer(staff)).send({ status: 'PREPARING' }).expect(409);
    expect(bad.body.code).toBe('INVALID_STATUS_TRANSITION');
    // Nhân viên không thể tự đặt PAID
    await ctx.http().patch(`/orders/${order.id}/status`).set(bearer(staff)).send({ status: 'PAID' }).expect(422);

    await ctx.http().post('/payments').set(bearer(token)).set('Idempotency-Key', newKey()).send({ orderId: order.id, method: 'WALLET' }).expect(201);
    for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
      const res = await ctx.http().patch(`/orders/${order.id}/status`).set(bearer(staff)).send({ status }).expect(200);
      expect(res.body.status).toBe(status);
    }
    // COMPLETED là trạng thái kết thúc
    const terminal = await ctx.http().patch(`/orders/${order.id}/status`).set(bearer(staff)).send({ status: 'CANCELLED' }).expect(409);
    expect(terminal.body.details).toEqual({ from: 'COMPLETED', to: 'CANCELLED', allowed: [] });

    const detail = await ctx.http().get(`/orders/${order.id}`).set(bearer(token)).expect(200);
    expect(detail.body.history.map((h: { to: string }) => h.to)).toEqual(['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED']);
  });

  it('INT-T08 hủy đơn hoàn lại tồn kho và lượt dùng mã', async () => {
    const p = await productByName(ctx.prisma, 'Sinh tố bơ');
    const promoBefore = await ctx.prisma.promotion.findUniqueOrThrow({ where: { code: 'GIAM15K' } });
    const order = (await createOrder({ items: [{ productId: p.id, size: 'L', qty: 3 }], promoCode: 'GIAM15K' }).expect(201)).body;
    expect((await productByName(ctx.prisma, 'Sinh tố bơ')).stock).toBe(p.stock - 3);

    const cancelled = await ctx.http().post(`/orders/${order.id}/cancel`).set(bearer(token)).expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');
    expect((await productByName(ctx.prisma, 'Sinh tố bơ')).stock).toBe(p.stock);
    expect((await ctx.prisma.promotion.findUniqueOrThrow({ where: { code: 'GIAM15K' } })).usedCount).toBe(promoBefore.usedCount);
    // hủy lần 2 => trạng thái kết thúc
    await ctx.http().post(`/orders/${order.id}/cancel`).set(bearer(token)).expect(409);
  });

  describe('INT-T09 (Task 10c) đặt hàng đồng thời không vượt tồn kho', () => {
    it('20 yêu cầu đồng thời cho sản phẩm còn 5 phần => đúng 5 đơn thành công, tồn kho = 0', async () => {
      const product = await ctx.prisma.product.update({
        where: { id: (await productByName(ctx.prisma, 'Cold Brew cam')).id },
        data: { stock: 5 },
      });
      const users = await Promise.all(Array.from({ length: 4 }, () => registerUser(ctx)));

      const responses = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          createOrder({ items: [{ productId: product.id, size: 'S', qty: 1 }] }, users[i % users.length].token),
        ),
      );
      const created = responses.filter((r) => r.status === 201);
      const rejected = responses.filter((r) => r.status === 409);

      expect(created).toHaveLength(5);
      expect(rejected).toHaveLength(15);
      expect(rejected.every((r) => ['OUT_OF_STOCK', 'CONCURRENT_UPDATE'].includes(r.body.code))).toBe(true);

      const after = await ctx.prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(after.stock).toBe(0);
      const sold = await ctx.prisma.orderItem.aggregate({
        _sum: { qty: true },
        where: { productId: product.id, order: { status: { not: 'CANCELLED' } } },
      });
      expect(sold._sum.qty).toBe(5);
    });

    it('đơn nhiều phần đồng thời (qty=2, tồn 5) => tối đa 2 đơn, không bao giờ âm kho', async () => {
      const product = await ctx.prisma.product.update({
        where: { id: (await productByName(ctx.prisma, 'Trà sữa matcha')).id },
        data: { stock: 5 },
      });
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => createOrder({ items: [{ productId: product.id, size: 'M', qty: 2 }] })),
      );
      expect(responses.filter((r) => r.status === 201)).toHaveLength(2);
      const after = await ctx.prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(after.stock).toBe(1);
      expect(after.version).toBeGreaterThanOrEqual(2);
    });
  });
});
