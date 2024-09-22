import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SmsModule } from './shared/sms/sms.module';
import { UploadModule } from './shared/upload/upload.module';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { User } from './modules/users/entities/users.entity';
import { PaypalModule } from './modules/paypal/paypal.module';
import { BillingPlan } from './modules/paypal/entities/billing.entity';
import { Product } from './modules/paypal/entities/product.entity';
import { OAuth2Token } from './modules/paypal/entities/token.entity';
import { Subscription } from './modules/paypal/entities/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: parseInt(config.get<string>('DATABASE_PORT')),
        username: config.get<string>('DATABASE_USERNAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, RefreshToken],
        synchronize: true,
        ssl: false
          // process.env.NODE_ENV === 'development'
          //   ? { rejectUnauthorized: false }
          //   : { rejectUnauthorized: true },
      }),
    }),
    AuthModule,
    UsersModule,
    SmsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
