import { HttpStatus } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';

/**
 * Order State Machine (Task 10.1 - docs/diagrams/state-order.puml)
 *
 *   PENDING --thanh toán OK--> PAID --barista nhận--> PREPARING --pha xong--> READY --giao khách--> COMPLETED
 *   PENDING --thanh toán lỗi--> PAYMENT_FAILED --thử lại--> PENDING
 *   PENDING | PAYMENT_FAILED | PAID --hủy--> CANCELLED
 *
 * COMPLETED và CANCELLED là trạng thái kết thúc. Mọi chuyển tiếp khác bị assertTransition chặn.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  PAYMENT_FAILED: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

/** Các trạng thái mà nhân viên quầy được phép chuyển tới qua PATCH /orders/:id/status */
export const STAFF_TARGET_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export class InvalidTransitionError extends DomainError {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super('INVALID_STATUS_TRANSITION', `Không thể chuyển đơn từ ${from} sang ${to}`, HttpStatus.CONFLICT, {
      from,
      to,
      allowed: ORDER_TRANSITIONS[from],
    });
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Đơn có thể (tiếp tục) thanh toán hay không. */
export function isPayable(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING || status === OrderStatus.PAYMENT_FAILED;
}
