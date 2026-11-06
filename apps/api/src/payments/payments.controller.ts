import { Body, Controller, Headers, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser, JwtAuthGuard } from '../auth/guards';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Thanh toán đơn (idempotent theo header Idempotency-Key)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID do client sinh cho mỗi lần thanh toán' })
  async pay(
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreatePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const outcome = await this.payments.pay(user.id, idempotencyKey, dto);
    if (outcome.replayed) res.setHeader('Idempotent-Replayed', 'true');
    return outcome;
  }
}
