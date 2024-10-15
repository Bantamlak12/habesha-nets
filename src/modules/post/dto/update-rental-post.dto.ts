import { plainToClass, Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsDecimal,
  ValidateNested,
} from 'class-validator';
import { Availability } from './availability.dto';
import { ContactInfo } from './contact.dto';
import { Location } from './location.dto';

export class UpdateRentalPostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rentalType: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsOptional()
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

  @IsOptional()
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

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfo)
  contactInfo?: ContactInfo;

  @IsOptional()
  @IsIn(['available', 'rented'])
  postStatus: 'available' | 'rented';
}
