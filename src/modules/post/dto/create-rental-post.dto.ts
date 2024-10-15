import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsJSON,
  IsDecimal,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Location } from './location.dto';
import { plainToClass, Transform, Type } from 'class-transformer';
import { Availability } from './availability.dto';
import { ContactInfo } from './contact.dto';

export class CreatePropertyOwnersDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  rentalType: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @ValidateNested()
  @Type(() => Location)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(Location, parsedValue);
    }
    return value;
  })
  location: Location;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ValidateNested()
  @Type(() => Availability)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(Availability, parsedValue);
    }
    return value;
  })
  availabilityDate: Availability;

  @ValidateNested()
  @Type(() => ContactInfo)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(ContactInfo, parsedValue);
    }
    return value;
  })
  contactInfo?: ContactInfo;

  @IsIn(['available', 'rented'])
  postStatus: 'available' | 'rented';
}
