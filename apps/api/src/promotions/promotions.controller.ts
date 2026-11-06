import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Các mã khuyến mãi đang hiệu lực' })
  list() {
    return this.promotions.listActive();
  }

  @Post('validate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Kiểm tra mã và xem trước số tiền giảm' })
  validate(@Body() dto: ValidatePromotionDto) {
    return this.promotions.preview(dto.code, dto.subtotal);
  }
}
