import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'password',
    description: 'The admins new password',
  })
  newPassword: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'password',
    description: 'Confirm the password to reset the password.',
  })
  confirmPassword: string;
}
