import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  rentalType: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsObject()
  location: {
    city?: string;
    country?: string;
  };

  @IsObject()
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
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsNumber()
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
