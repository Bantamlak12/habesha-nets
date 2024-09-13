import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'example@gmail.com',
  })
  emailOrPhone: string;

  @IsString()
  @ApiProperty({
    example: 'password',
  })
  password: string;
}
