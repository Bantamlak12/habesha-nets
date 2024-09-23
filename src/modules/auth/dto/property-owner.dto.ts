import { plainToClass, Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';

export class PropertyOwnerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsString()
  bio: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(AddressDto, parsedValue);
    }
    return value;
  })
  address: AddressDto;

  @IsOptional()
  @IsString()
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @IsString()
  propertyType: string;
}
