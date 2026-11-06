import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LoyaltyService } from '../loyalty/loyalty';
import { PromotionsModule } from '../promotions/promotions.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, PromotionsModule],
  controllers: [OrdersController],
  providers: [OrdersService, LoyaltyService],
  exports: [OrdersService, LoyaltyService],
})
export class OrdersModule {}
