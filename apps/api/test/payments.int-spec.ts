import {
  bearer,
  createTestApp,
  loginStaff,
  newKey,
  productByName,
  registerUser,
  resetDatabase,
  TestContext,
} from "./helpers";

describe("Payments integration (PAY-T01..T10)", () => {
  let ctx: TestContext;
  let token: string;
  let userId: number;
  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    ({ token, userId } = await registerUser(ctx));
  });
  afterAll(() => ctx.app.close());
  const create = async () => {
    const product = await productByName(ctx.prisma, "Cappuccino");
    return (
      await ctx
        .http()
        .post("/orders")
        .set(bearer(token))
        .send({
          items: [{ productId: product.id, size: "M", qty: 1 }],
          promoCode: "WELCOME10",
        })
        .expect(201)
    ).body;
  };
  const pay = (
    id: number,
    key: string = newKey(),
    method = "WALLET",
    cardNumber?: string,
    auth = token,
  ) =>
    ctx
      .http()
      .post("/payments")
      .set(bearer(auth))
      .set("Idempotency-Key", key)
      .send({ orderId: id, method, ...(cardNumber ? { cardNumber } : {}) });

  it("PAY-T01 success atomically marks PAID, snapshots amount and awards points", async () => {
    const o = await create();
    const r = await pay(o.id).expect(201);
    expect(r.body.payment).toMatchObject({
      status: "SUCCEEDED",
      amount: 45000,
    });
    expect(r.body.order).toMatchObject({ status: "PAID", pointsEarned: 4 });
    const u = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(u.loyaltyPoints).toBe(4);
  });

  it("PAY-T02 sequential replay returns same payment with one charge and one loyalty entry", async () => {
    const o = await create(),
      key = newKey(),
      charges = ctx.gateway.successfulCharges;
    const a = await pay(o.id, key).expect(201);
    const b = await pay(o.id, key).expect(201);
    expect(b.body.payment.id).toBe(a.body.payment.id);
    expect(b.body.replayed).toBe(true);
    expect(ctx.gateway.successfulCharges - charges).toBe(1);
    expect(await ctx.prisma.payment.count({ where: { orderId: o.id } })).toBe(
      1,
    );
    expect(
      await ctx.prisma.loyaltyTransaction.count({
        where: { orderId: o.id, type: "EARN" },
      }),
    ).toBe(1);
  });

  it("PAY-T03 ten concurrent same-key requests all replay the same payment", async () => {
    const o = await create(),
      key = newKey(),
      charges = ctx.gateway.successfulCharges;
    const original = ctx.gateway.charge.bind(ctx.gateway);
    const slow = jest
      .spyOn(ctx.gateway, "charge")
      .mockImplementation(async (req) => {
        await new Promise((r) => setTimeout(r, 150));
        return original(req);
      });
    try {
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => pay(o.id, key)),
      );
      expect(responses.map((r) => r.status)).toEqual(Array(10).fill(201));
      expect(new Set(responses.map((r) => r.body.payment.id)).size).toBe(1);
      expect(ctx.gateway.successfulCharges - charges).toBe(1);
      expect(slow).toHaveBeenCalledTimes(1);
      expect(await ctx.prisma.order.count({ where: { id: o.id } })).toBe(1);
    } finally {
      slow.mockRestore();
    }
  });

  it("PAY-T04 reused key with changed order/method or user is rejected", async () => {
    const a = await create(),
      b = await create(),
      key = newKey();
    await pay(a.id, key).expect(201);
    await pay(b.id, key).expect(422);
    await pay(a.id, key, "CARD", "4242424242424242").expect(422);
    const other = await registerUser(ctx);
    await pay(a.id, key, "WALLET", undefined, other.token).expect(422);
  });

  it("PAY-T05 declined card preserves reserved stock; retry same order with new key succeeds", async () => {
    const o = await create(),
      key = newKey();
    const failed = await pay(o.id, key, "CARD", "4000000000000002").expect(201);
    expect(failed.body.order.status).toBe("PAYMENT_FAILED");
    expect(failed.body.payment.failureReason).toBe("CARD_DECLINED");
    expect(
      await ctx.prisma.loyaltyTransaction.count({ where: { orderId: o.id } }),
    ).toBe(0);
    const replay = await pay(o.id, key, "CARD", "4242424242424242").expect(201);
    expect(replay.body.payment.status).toBe("FAILED");
    const success = await pay(
      o.id,
      newKey(),
      "CARD",
      "4242424242424242",
    ).expect(201);
    expect(success.body.order.status).toBe("PAID");
    expect(await ctx.prisma.payment.count({ where: { orderId: o.id } })).toBe(
      2,
    );
    expect(success.body.order.history.map((h: { to: string }) => h.to)).toEqual(
      ["PENDING", "PAYMENT_FAILED", "PENDING", "PAID"],
    );
  });

  it("PAY-T06 two different keys on one order cannot charge twice", async () => {
    const o = await create(),
      charges = ctx.gateway.successfulCharges;
    const responses = await Promise.all([pay(o.id), pay(o.id)]);
    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(1);
    expect(ctx.gateway.successfulCharges - charges).toBe(1);
  });

  it("PAY-T07 key required, DTO and ownership checks protect payment", async () => {
    const o = await create(),
      other = await registerUser(ctx);
    await ctx
      .http()
      .post("/payments")
      .set(bearer(token))
      .send({ orderId: o.id, method: "WALLET" })
      .expect(400);
    await pay(o.id, "short").expect(400);
    await pay(o.id, newKey(), "CASH").expect(400);
    await pay(o.id, newKey(), "CARD", "123").expect(400);
    await pay(o.id, newKey(), "WALLET", undefined, other.token).expect(404);
  });

  it("PAY-T08 staff cancellation reverses loyalty and stock once", async () => {
    const o = await create();
    await pay(o.id).expect(201);
    const staff = await loginStaff(ctx);
    const r = await ctx
      .http()
      .patch(`/orders/${o.id}/status`)
      .set(bearer(staff))
      .send({ status: "CANCELLED" })
      .expect(200);
    expect(r.body.status).toBe("CANCELLED");
    expect(
      await ctx.prisma.loyaltyTransaction.count({
        where: { orderId: o.id, type: "REVERT" },
      }),
    ).toBe(1);
    await ctx
      .http()
      .patch(`/orders/${o.id}/status`)
      .set(bearer(staff))
      .send({ status: "CANCELLED" })
      .expect(409);
    await pay(o.id).expect(409);
  });

  it("PAY-T09 customer and staff cannot cancel while gateway is processing", async () => {
    const o = await create(),
      staff = await loginStaff(ctx),
      original = ctx.gateway.charge.bind(ctx.gateway);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const delayed = jest
      .spyOn(ctx.gateway, "charge")
      .mockImplementation(async (req) => {
        entered();
        await gate;
        return original(req);
      });
    const inFlight = pay(o.id).then((r) => r);
    try {
      await started;
      await ctx
        .http()
        .post(`/orders/${o.id}/cancel`)
        .set(bearer(token))
        .expect(409);
      await ctx
        .http()
        .patch(`/orders/${o.id}/status`)
        .set(bearer(staff))
        .send({ status: "CANCELLED" })
        .expect(409);
    } finally {
      release();
      await inFlight;
      delayed.mockRestore();
    }
    expect(
      (await ctx.prisma.order.findUniqueOrThrow({ where: { id: o.id } }))
        .status,
    ).toBe("PAID");
  });

  it("PAY-T10 gateway exception becomes failed payment, not a lost processing row", async () => {
    const o = await create();
    const spy = jest
      .spyOn(ctx.gateway, "charge")
      .mockRejectedValueOnce(new Error("network"));
    try {
      const r = await pay(o.id).expect(201);
      expect(r.body.order.status).toBe("PAYMENT_FAILED");
      expect(r.body.payment.failureReason).toBe("GATEWAY_UNAVAILABLE");
    } finally {
      spy.mockRestore();
    }
  });
});
