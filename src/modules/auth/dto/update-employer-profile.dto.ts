import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { plainToClass, Transform, Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class UpdateEmployerProfile {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  secondaryEmail: string;

  @IsOptional()
  @IsString()
  secondaryPhoneNumber: string;

  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  preferredContactMethod: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsedValue = JSON.parse(value);
        return plainToClass(AddressDto, parsedValue);
      } catch (error) {
        throw new Error(`Invalid JSON format for location. ${error}`);
      }
    }
    return value;
  })
  address: AddressDto;

  @IsOptional()
  @IsString()
  bio: string;
}
