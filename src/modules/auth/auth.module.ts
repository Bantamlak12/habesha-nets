import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerConfigModule } from 'src/shared/mailer/mailer.module';
import { SmsModule } from 'src/shared/sms/sms.module';
import { UploadModule } from 'src/shared/upload/upload.module';
import { Employer } from '../users/entities/employer.entity';
import { Freelancer } from '../users/entities/freelancer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employer,
      Freelancer,
      ServiceProvider,
      PropertyOwner,
      PropertyRenter,
    ]),
    MailerConfigModule,
    SmsModule,
    UploadModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
