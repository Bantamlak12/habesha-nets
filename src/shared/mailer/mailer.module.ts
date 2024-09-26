import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomMailerService } from './mailer.service';
import { Subscription } from 'src/modules/paypal/entities/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), ConfigModule],
  providers: [CustomMailerService],
  exports: [CustomMailerService],
})
export class MailerConfigModule {}
