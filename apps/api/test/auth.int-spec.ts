import { bearer, createTestApp, registerUser, resetDatabase, TestContext } from './helpers';

describe('Auth API (AUTH-T01..T05)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });
  afterAll(() => ctx.app.close());

  it('AUTH-T01 đăng ký trả JWT, không lộ passwordHash, mật khẩu được băm bcrypt', async () => {
    const res = await ctx
      .http()
      .post('/auth/register')
      .send({ email: '  An.Nguyen@Example.com ', password: 'Matkhau123', fullName: 'Nguyễn Văn An' })
      .expect(201);
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    expect(res.body.user).toEqual(expect.objectContaining({ email: 'an.nguyen@example.com', role: 'CUSTOMER', loyaltyPoints: 0 }));
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { email: 'an.nguyen@example.com' } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(stored.passwordHash).not.toContain('Matkhau123');
  });

  it('AUTH-T02 email trùng => 409 EMAIL_TAKEN', async () => {
    const res = await ctx
      .http()
      .post('/auth/register')
      .send({ email: 'an.nguyen@example.com', password: 'Matkhau123', fullName: 'Trùng Email' })
      .expect(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('AUTH-T03 validate đầu vào: email sai, mật khẩu yếu, field lạ => 400', async () => {
    const res = await ctx.http().post('/auth/register').send({ email: 'khong-phai-email', password: '123', fullName: 'A' }).expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining(['Email không hợp lệ', 'Mật khẩu tối thiểu 8 ký tự', 'Họ tên tối thiểu 2 ký tự']),
    );
    await ctx
      .http()
      .post('/auth/register')
      .send({ email: 'x@y.vn', password: 'Matkhau123', fullName: 'Hacker', role: 'STAFF' })
      .expect(400); // không thể tự nâng quyền
  });

  it('AUTH-T04 đăng nhập đúng => 200 + JWT; sai mật khẩu hoặc email => 401 thông báo chung', async () => {
    const ok = await ctx.http().post('/auth/login').send({ email: 'demo@brewlite.vn', password: 'Demo@1234' }).expect(200);
    expect(ok.body.accessToken).toBeDefined();
    const wrongPass = await ctx.http().post('/auth/login').send({ email: 'demo@brewlite.vn', password: 'sai-mat-khau' }).expect(401);
    const noUser = await ctx.http().post('/auth/login').send({ email: 'none@brewlite.vn', password: 'Demo@1234' }).expect(401);
    expect(wrongPass.body.message).toBe(noUser.body.message);
  });

  it('AUTH-T05 GET /auth/me cần JWT hợp lệ', async () => {
    const { token } = await registerUser(ctx);
    const me = await ctx.http().get('/auth/me').set(bearer(token)).expect(200);
    expect(me.body.role).toBe('CUSTOMER');
    await ctx.http().get('/auth/me').expect(401);
    await ctx.http().get('/auth/me').set(bearer('abc.def.ghi')).expect(401);
  });
});
