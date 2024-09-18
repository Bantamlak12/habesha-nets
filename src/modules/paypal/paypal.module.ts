import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { PaypalController } from './paypal.controller';
import { PaypalService } from './paypal.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [PaypalController],
  providers: [PaypalService, CustomMailerService],
  exports: [PaypalService],
})
export class PaypalModule {}
