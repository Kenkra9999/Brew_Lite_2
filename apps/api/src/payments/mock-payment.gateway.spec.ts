import { ConfigService } from '@nestjs/config';
import { DECLINED_CARD, luhnValid, MockPaymentGateway, WALLET_BALANCE } from './mock-payment.gateway';

const config = (env: Record<string, unknown>) => ({ get: (k: string) => env[k] }) as unknown as ConfigService;

describe('MockPaymentGateway (UNIT-T04 - FR-14)', () => {
  const make = (failureRate = 0, random = () => 0.99) =>
    new MockPaymentGateway(config({ PAYMENT_LATENCY_MS: 0, PAYMENT_FAILURE_RATE: failureRate }), random);

  it('kiểm tra Luhn', () => {
    expect(luhnValid('4242424242424242')).toBe(true);
    expect(luhnValid(DECLINED_CARD)).toBe(true);
    expect(luhnValid('4242424242424241')).toBe(false);
    expect(luhnValid('abc')).toBe(false);
  });

  it('thanh toán ví thành công và trả mã giao dịch', async () => {
    const gw = make();
    const r = await gw.charge({ idempotencyKey: 'key-00000001', amount: 50_000, method: 'WALLET' });
    expect(r.success).toBe(true);
    expect(r.transactionRef).toMatch(/^MOCK-WALLET-/);
    expect(gw.successfulCharges).toBe(1);
  });

  it('thẻ test 4000 0000 0000 0002 bị từ chối', async () => {
    const r = await make().charge({ idempotencyKey: 'key-00000002', amount: 50_000, method: 'CARD', cardNumber: DECLINED_CARD });
    expect(r).toEqual({ success: false, transactionRef: null, failureReason: 'CARD_DECLINED' });
  });

  it('thẻ sai Luhn bị từ chối CARD_INVALID', async () => {
    const r = await make().charge({ idempotencyKey: 'key-00000003', amount: 50_000, method: 'CARD', cardNumber: '1234567812345678' });
    expect(r.failureReason).toBe('CARD_INVALID');
  });

  it('ví không đủ số dư', async () => {
    const r = await make().charge({ idempotencyKey: 'key-00000004', amount: WALLET_BALANCE + 1, method: 'WALLET' });
    expect(r.failureReason).toBe('INSUFFICIENT_BALANCE');
  });

  it('mô phỏng sự cố cổng theo PAYMENT_FAILURE_RATE', async () => {
    const r = await make(0.5, () => 0.1).charge({ idempotencyKey: 'key-00000005', amount: 50_000, method: 'WALLET' });
    expect(r.failureReason).toBe('GATEWAY_ERROR');
  });

  it('gateway idempotent: cùng key chỉ trừ tiền một lần và trả cùng kết quả', async () => {
    const gw = make();
    const req = { idempotencyKey: 'key-same-0001', amount: 50_000, method: 'WALLET' as const };
    const [a, b] = await Promise.all([gw.charge(req), gw.charge(req)]);
    const c = await gw.charge(req);
    expect(c).toEqual(a);
    expect(b.success).toBe(true);
    expect(c.transactionRef).toBe(a.transactionRef);
  });
});
