import { OrderStatus } from '@prisma/client';
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  isPayable,
  isTerminal,
  ORDER_TRANSITIONS,
} from './order-state-machine';

const { PENDING, PAID, PAYMENT_FAILED, PREPARING, READY, COMPLETED, CANCELLED } = OrderStatus;

describe('Order State Machine (UNIT-T01 - Task 10.1)', () => {
  it('cho phép toàn bộ luồng thành công PENDING → PAID → PREPARING → READY → COMPLETED', () => {
    const happyPath = [PENDING, PAID, PREPARING, READY, COMPLETED];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(() => assertTransition(happyPath[i], happyPath[i + 1])).not.toThrow();
    }
  });

  it.each([
    [PENDING, PAYMENT_FAILED],
    [PAYMENT_FAILED, PENDING], // thử lại
    [PENDING, CANCELLED],
    [PAYMENT_FAILED, CANCELLED],
    [PAID, CANCELLED],
  ])('cho phép nhánh ngoại lệ %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [PENDING, PREPARING], // chưa thanh toán đã pha chế
    [PENDING, COMPLETED],
    [PAID, PENDING], // quay lui
    [PAID, READY], // nhảy cóc
    [PREPARING, CANCELLED], // đã pha thì không hủy
    [READY, PREPARING],
    [PAYMENT_FAILED, PAID], // phải quay về PENDING trước khi thanh toán lại
    [COMPLETED, CANCELLED], // trạng thái kết thúc
    [CANCELLED, PENDING],
    [PAID, PAID], // không tự chuyển vào chính nó
  ])('chặn chuyển trạng thái sai %s → %s bằng InvalidTransitionError', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
    expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
  });

  it('lỗi mang mã INVALID_STATUS_TRANSITION, HTTP 409 và danh sách trạng thái hợp lệ', () => {
    let err: InvalidTransitionError | undefined;
    try {
      assertTransition(COMPLETED, PENDING);
    } catch (e) {
      err = e as InvalidTransitionError;
    }
    expect(err).toBeInstanceOf(InvalidTransitionError);
    expect(err?.code).toBe('INVALID_STATUS_TRANSITION');
    expect(err?.httpStatus).toBe(409);
    expect(err?.details).toEqual({ from: COMPLETED, to: PENDING, allowed: [] });
  });

  it('COMPLETED và CANCELLED là trạng thái kết thúc (không có chuyển tiếp ra)', () => {
    expect(ORDER_TRANSITIONS[COMPLETED]).toHaveLength(0);
    expect(ORDER_TRANSITIONS[CANCELLED]).toHaveLength(0);
    expect(isTerminal(COMPLETED)).toBe(true);
    expect(isTerminal(CANCELLED)).toBe(true);
    expect(isTerminal(PAID)).toBe(false);
  });

  it('chỉ PENDING và PAYMENT_FAILED được phép thanh toán', () => {
    const payable = Object.values(OrderStatus).filter(isPayable);
    expect(payable.sort()).toEqual([PAYMENT_FAILED, PENDING].sort());
  });

  it('bảng chuyển tiếp định nghĩa đủ cho mọi trạng thái của enum', () => {
    expect(Object.keys(ORDER_TRANSITIONS).sort()).toEqual(Object.values(OrderStatus).sort());
  });
});
