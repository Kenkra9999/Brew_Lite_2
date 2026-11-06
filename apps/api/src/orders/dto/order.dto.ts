import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_QTY_PER_LINE, MAX_TOPPINGS_PER_ITEM, type SizeCode } from '../pricing';

export class OrderItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ enum: ['S', 'M', 'L'], example: 'M' })
  @IsIn(['S', 'M', 'L'], { message: 'size phải là S, M hoặc L' })
  size: SizeCode;

  @ApiProperty({ type: [Number], example: [1], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TOPPINGS_PER_ITEM, { message: `Tối đa ${MAX_TOPPINGS_PER_ITEM} topping` })
  @ArrayUnique()
  @IsInt({ each: true })
  toppingIds: number[] = [];

  @ApiProperty({ example: 1, minimum: 1, maximum: MAX_QTY_PER_LINE })
  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_LINE)
  qty: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Giỏ hàng trống' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  promoCode?: string;

  @ApiPropertyOptional({ example: 'Ít đá' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PREPARING })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
