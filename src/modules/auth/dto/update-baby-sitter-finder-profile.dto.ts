import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { plainToClass, Transform, Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class UpdateBabySitterFinderDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

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
