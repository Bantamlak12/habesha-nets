import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreatePropertyOwnersDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  rentalType: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsObject()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  location: {
    city?: string;
    country?: string;
  };

  @IsObject()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  availabilityDate: {
    from: Date;
    to: Date;
  };

  @IsOptional()
  @IsString()
  rentalDuration?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  contactInfo?: string;

  @IsOptional()
  @IsString()
  rulesAndConditions?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  capacity?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  insurance?: number;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsOptional()
  @IsString()
  utilities?: string;

  @IsOptional()
  @IsString()
  rentalTerms?: string;
}
