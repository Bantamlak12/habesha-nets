import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OtpDto {
  @IsString()
  @ApiProperty({ example: '34435' })
  otp: string;
}
