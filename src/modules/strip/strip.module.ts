import { Module } from '@nestjs/common';
import { StripeService } from '../strip/strip.service';
import { PaymentController } from '../strip/strip.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriptions } from './strip.entity';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/users.entity';
import { PerPostPayment } from './strip.perpost.entity';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscriptions,
      User,
      PerPostPayment   
    ]),
    ConfigModule.forRoot(),
    HttpModule,
    AuthModule,
  ],
  controllers: [PaymentController],
  providers: [StripeService, CustomMailerService],
  exports: [StripeService]
})
export class SubscriptionModule {}
