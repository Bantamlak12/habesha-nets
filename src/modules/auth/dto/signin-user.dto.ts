import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
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
