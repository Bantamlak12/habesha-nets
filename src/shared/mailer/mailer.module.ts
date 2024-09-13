import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomMailerService } from './mailer.service';

@Module({
  imports: [ConfigModule],
  providers: [CustomMailerService],
  exports: [CustomMailerService],
})
export class MailerConfigModule {}
