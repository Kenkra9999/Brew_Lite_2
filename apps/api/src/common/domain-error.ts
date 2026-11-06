import { HttpStatus } from '@nestjs/common';

/**
 * Lỗi nghiệp vụ thuần (không phụ thuộc HTTP). DomainExceptionFilter
 * chuyển chúng thành response JSON { statusCode, code, message }.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: number | string) {
    super(`${entity.toUpperCase()}_NOT_FOUND`, `${entity} #${id} không tồn tại`, HttpStatus.NOT_FOUND);
  }
}

export class OutOfStockError extends DomainError {
  constructor(productName: string, available: number) {
    super('OUT_OF_STOCK', `"${productName}" chỉ còn ${available} phần`, HttpStatus.CONFLICT, {
      productName,
      available,
    });
  }
}

/** Ném ra khi bản ghi đã bị transaction khác cập nhật (version không khớp). */
export class OptimisticLockError extends DomainError {
  constructor(entity: string) {
    super('CONCURRENT_UPDATE', `${entity} vừa được cập nhật bởi yêu cầu khác, vui lòng thử lại`, HttpStatus.CONFLICT);
  }
}
