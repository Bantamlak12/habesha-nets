import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: '12345678',
    description: 'Old password of the admin',
  })
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'password',
    description: 'The new password of the admin',
  })
  newPassword: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'password',
    description: 'Confirm the new password of the admin',
  })
  confirmPassword: string;
}
