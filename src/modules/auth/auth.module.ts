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
import { Freelancer } from '../users/entities/freelancer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employer,
      Freelancer,
      ServiceProvider,
      PropertyOwner,
      PropertyRenter,
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
