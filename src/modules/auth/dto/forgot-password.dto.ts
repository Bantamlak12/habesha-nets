import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailOrPhone } from 'src/common/is-phone-or-email.validator';

export class ForgotPasswordDto {
  @IsOptional()
  email?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsEmailOrPhone()
  @ApiProperty({
    example: '+2514454523457',
  })
  emailOrPhoneNumber: string;
}
