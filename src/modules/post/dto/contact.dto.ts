import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ContactInfo {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
