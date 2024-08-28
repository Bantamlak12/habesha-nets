import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MailerConfigModule } from 'src/shared/mailer/mailer.module';
import { SmsModule } from 'src/shared/sms/sms.module';
import { UploadModule } from 'src/shared/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MailerConfigModule,
    SmsModule,
    UploadModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
