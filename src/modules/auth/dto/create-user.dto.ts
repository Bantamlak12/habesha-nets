import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsPhoneNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailOrPhone } from 'src/common/is-phone-or-email.validator';

@IsEmailOrPhone()
export class CreateUserDto {
  @IsString()
  @IsIn([
    'employer',
    'freelancer',
    'serviceProvider',
    'propertyOwner',
    'propertyRenter',
  ])
  @ApiProperty({
    example: 'employer',
    description:
      'User type must be one of these: employer, serviceProvider, propertyRenter, propertyOwner or babySitterfinder',
  })
  userType: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @ApiProperty({
    example: 'example@gmail.com',
  })
  email: string;

  @IsOptional()
  @IsPhoneNumber(null, { message: 'Invalid phone number format' })
  //   @ApiProperty({
  //     example: '+12192643829',
  //   })
  phoneNumber?: string;

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
