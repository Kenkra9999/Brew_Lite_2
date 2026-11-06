import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Matches, Min, ValidateIf } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.WALLET })
  @IsEnum(PaymentMethod, { message: 'method phải là WALLET hoặc CARD' })
  method: PaymentMethod;

  @ApiPropertyOptional({ example: '4242 4242 4242 4242', description: 'Bắt buộc khi method = CARD. Không được lưu vào CSDL.' })
  @ValidateIf((o: CreatePaymentDto) => o.method === PaymentMethod.CARD)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
  @Matches(/^\d{16}$/, { message: 'Số thẻ phải gồm 16 chữ số' })
  cardNumber?: string;
}

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
