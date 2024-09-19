import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { PaypalController } from './paypal.controller';
import { PaypalService } from './paypal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingPlan } from './entities/billing.entity';
import { Product } from './entities/product.entity';
import { Subscription } from 'rxjs';
import { OAuth2Token } from './entities/token.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingPlan, Product, Subscription, OAuth2Token]),
    ConfigModule.forRoot(),
    HttpModule,
    AuthModule,
  ],
  controllers: [PaypalController],
  providers: [PaypalService, CustomMailerService, JwtService],
  exports: [PaypalService],
})
export class PaypalModule {}
