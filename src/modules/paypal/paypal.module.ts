import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { PaypalController } from './paypal.controller';
import { PaypalService } from './paypal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingPlan } from './entities/billing.entity';
import { Product } from './entities/product.entity';
import { OAuth2Token } from './entities/token.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/users.entity';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/per-post-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingPlan,
      Product,
      Subscription,
      OAuth2Token,
      User,
      Payment
    ]),
    ConfigModule.forRoot(),
    HttpModule,
    AuthModule,
  ],
  controllers: [PaypalController],
  providers: [PaypalService],
  exports: [PaypalService],
})
export class PaypalModule {}
