import { createTestApp, resetDatabase, TestContext } from './helpers';

describe('Products & Health API (API-T01..T05)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });
  afterAll(() => ctx.app.close());

  it('API-T01 GET /products trả menu JSON (id, tên, giá, ảnh)', async () => {
    const res = await ctx.http().get('/products').expect(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(Number),
        imageUrl: expect.stringMatching(/^\/images\//),
        available: true,
      }),
    );
  });

  it('API-T02 lọc theo danh mục và tìm kiếm', async () => {
    const tea = await ctx.http().get('/products').query({ category: 'Trà' }).expect(200);
    expect(tea.body.every((p: { category: string }) => p.category === 'Trà')).toBe(true);
    const search = await ctx.http().get('/products').query({ search: 'cappu' }).expect(200);
    expect(search.body.map((p: { name: string }) => p.name)).toEqual(['Cappuccino']);
  });

  it('API-T03 GET /products/:id trả chi tiết kèm bảng giá size và topping', async () => {
    const list = await ctx.http().get('/products').expect(200);
    const cappuccino = list.body.find((p: { name: string }) => p.name === 'Cappuccino');
    const res = await ctx.http().get(`/products/${cappuccino.id}`).expect(200);
    expect(res.body.sizes).toEqual([
      { size: 'S', surcharge: 0, price: 45_000 },
      { size: 'M', surcharge: 5_000, price: 50_000 },
      { size: 'L', surcharge: 10_000, price: 55_000 },
    ]);
    expect(res.body.toppings).toHaveLength(4);
  });

  it('API-T04 sản phẩm không tồn tại => 404, id sai định dạng => 400', async () => {
    const notFound = await ctx.http().get('/products/999999').expect(404);
    expect(notFound.body.code).toBe('PRODUCT_NOT_FOUND');
    await ctx.http().get('/products/abc').expect(400);
  });

  it('API-T05 GET /health báo database up và thời gian phản hồi < 500ms (NFR-01)', async () => {
    const started = Date.now();
    const res = await ctx.http().get('/health').expect(200);
    expect(res.body).toEqual(expect.objectContaining({ status: 'ok', checks: expect.objectContaining({ database: 'up' }) }));
    expect(Date.now() - started).toBeLessThan(500);
  });

  it('NFR-01 GET /products phản hồi < 500ms với dữ liệu mẫu', async () => {
    const started = Date.now();
    await ctx.http().get('/products').expect(200);
    expect(Date.now() - started).toBeLessThan(500);
  });
});
