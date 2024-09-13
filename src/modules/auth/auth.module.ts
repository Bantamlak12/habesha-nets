import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerConfigModule } from 'src/shared/mailer/mailer.module';
import { SmsModule } from 'src/shared/sms/sms.module';
import { UploadModule } from 'src/shared/upload/upload.module';
import { Employer } from '../users/entities/employer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';
import { ConfigService } from '@nestjs/config';
import { BabySitterFinder } from '../users/entities/babySitterFinder.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Employer,
      ServiceProvider,
      PropertyOwner,
      PropertyRenter,
      BabySitterFinder,
      RefreshToken,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    MailerConfigModule,
    SmsModule,
    UploadModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
