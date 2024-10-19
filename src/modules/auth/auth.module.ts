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
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/users.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResetTokens } from './entities/password-reset-token.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, RefreshToken, ResetTokens]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    MailerConfigModule,
    SmsModule,
    UploadModule,
  ],
  providers: [AuthService, LocalStrategy, JwtAuthGuard, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
