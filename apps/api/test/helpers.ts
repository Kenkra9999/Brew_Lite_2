import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seed } from '../src/database/seed';
import { MockPaymentGateway } from '../src/payments/mock-payment.gateway';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  gateway: MockPaymentGateway;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return {
    app,
    prisma: app.get(PrismaService),
    gateway: app.get(MockPaymentGateway),
    http: () => request(app.getHttpServer()),
  };
}

/** Xóa sạch dữ liệu và nạp lại seed để mỗi file test độc lập. */
export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Payment","OrderItem","OrderStatusHistory","LoyaltyTransaction","Order","Promotion","Topping","Product","User" CASCADE',
  );
  await seed(prisma);
}

export async function registerUser(ctx: TestContext, email = `u-${randomUUID().slice(0, 8)}@test.vn`) {
  const res = await ctx
    .http()
    .post('/auth/register')
    .send({ email, password: 'Matkhau123', fullName: 'Người Kiểm Thử' })
    .expect(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as number, email };
}

export async function loginStaff(ctx: TestContext) {
  const res = await ctx.http().post('/auth/login').send({ email: 'barista@brewlite.vn', password: 'Barista@1234' }).expect(200);
  return res.body.accessToken as string;
}

export async function productByName(prisma: PrismaService, name: string) {
  return prisma.product.findFirstOrThrow({ where: { name } });
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
export const newKey = () => randomUUID();
