import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ValidatePromotionDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 120000 })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  subtotal: number;
}
