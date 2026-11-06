import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: MockPaymentGateway,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new MockPaymentGateway(config),
    },
  ],
  exports: [MockPaymentGateway],
})
export class PaymentsModule {}
