import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

/**
 * Cổng thanh toán GIẢ LẬP (mô phỏng Momo/VNPay/Stripe) - ADR-004.
 * Quy tắc mô phỏng (để demo và kiểm thử có tính tất định):
 *  - Thẻ 4000 0000 0000 0002  => bị từ chối (CARD_DECLINED)
 *  - Thẻ không qua kiểm tra Luhn => CARD_INVALID
 *  - Ví có số dư giả lập WALLET_BALANCE => vượt quá thì INSUFFICIENT_BALANCE
 *  - PAYMENT_FAILURE_RATE (0..1) => lỗi ngẫu nhiên GATEWAY_ERROR (mô phỏng sự cố mạng)
 * Gateway cũng tự idempotent theo idempotencyKey như các cổng thật.
 */
export type GatewayMethod = 'WALLET' | 'CARD';

export interface ChargeRequest {
  idempotencyKey: string;
  amount: number;
  method: GatewayMethod;
  cardNumber?: string;
}

export interface ChargeResult {
  success: boolean;
  transactionRef: string | null;
  failureReason: string | null;
}

export const DECLINED_CARD = '4000000000000002';
export const WALLET_BALANCE = 2_000_000;

export function luhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

@Injectable()
export class MockPaymentGateway {
  private readonly processed = new Map<string, ChargeResult>();
  /** Số lần THỰC SỰ trừ tiền thành công - dùng trong test idempotency. */
  successfulCharges = 0;
  private readonly latencyMs: number;
  private readonly failureRate: number;

  constructor(
    config: ConfigService,
    @Optional() private readonly random: () => number = Math.random,
  ) {
    this.latencyMs = Number(config.get('PAYMENT_LATENCY_MS') ?? 300);
    this.failureRate = Number(config.get('PAYMENT_FAILURE_RATE') ?? 0);
  }

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    const cached = this.processed.get(req.idempotencyKey);
    if (cached) return cached;
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));

    const result = this.decide(req);
    if (result.success) this.successfulCharges++;
    this.processed.set(req.idempotencyKey, result);
    return result;
  }

  private decide(req: ChargeRequest): ChargeResult {
    const fail = (failureReason: string): ChargeResult => ({ success: false, transactionRef: null, failureReason });
    if (!Number.isInteger(req.amount) || req.amount <= 0) return fail('INVALID_AMOUNT');
    if (req.method === 'CARD') {
      const digits = (req.cardNumber ?? '').replace(/\D/g, '');
      if (!luhnValid(digits)) return fail('CARD_INVALID');
      if (digits === DECLINED_CARD) return fail('CARD_DECLINED');
    } else if (req.amount > WALLET_BALANCE) {
      return fail('INSUFFICIENT_BALANCE');
    }
    if (this.failureRate > 0 && this.random() < this.failureRate) return fail('GATEWAY_ERROR');
    return {
      success: true,
      transactionRef: `MOCK-${req.method}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
      failureReason: null,
    };
  }
}
