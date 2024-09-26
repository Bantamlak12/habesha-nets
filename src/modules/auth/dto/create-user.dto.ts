import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailOrPhone } from 'src/common/is-phone-or-email.validator';

export class CreateUserDto {
  @IsString()
  @IsIn([
    'employer',
    'serviceProvider',
    'propertyOwner',
    'propertyRenter',
    'babySitterFinder',
    'careGiverFinder',
  ])
  @ApiProperty({ example: 'employer' })
  userType: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsEmailOrPhone()
  @ApiProperty({
    example: '+2514454523457',
  })
  emailOrPhoneNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @ApiProperty({
    example: 'password',
  })
  password: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @ApiProperty({
    example: 'password',
  })
  confirmPassword: string;
}
