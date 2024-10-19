import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomMailerService } from './mailer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriptions } from 'src/modules/strip/strip.entity';
import { Subscription } from 'src/modules/paypal/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriptions, Subscription]), ConfigModule],
  providers: [CustomMailerService],
  exports: [CustomMailerService],
})
export class MailerConfigModule {}
