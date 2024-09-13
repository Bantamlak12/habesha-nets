import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerificationCodeDto {
  @IsString()
  @ApiProperty({ example: '897658' })
  verificationCode: string;
}
