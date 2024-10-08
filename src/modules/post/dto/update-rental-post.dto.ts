import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  IsIn,
} from 'class-validator';

export class UpdatePropertyOwnersDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  rentalType: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsOptional()
  @IsObject()
  location: {
    city?: string;
    country?: string;
  };

  @IsOptional()
  @IsObject()
  availabilityDate: {
    from: Date;
    to: Date;
  };

  @IsOptional()
  @IsString()
  numberOfBedRooms?: string;

  @IsOptional()
  @IsString()
  numberOfBathRooms?: string;

  @IsOptional()
  @IsString()
  size?: string;

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

  @IsOptional()
  @IsIn(['available', 'rented'])
  postStatus: 'available' | 'rented';
}
