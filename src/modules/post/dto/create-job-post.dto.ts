import {
  IsBoolean,
  IsDecimal,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Location } from './location.dto';
import { Type } from 'class-transformer';
import { ContactInfo } from './contact.dto';
import { Schedule } from './schedule.dto';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested()
  @Type(() => Location)
  location: Location;

  @IsBoolean()
  @IsOptional()
  remote?: boolean;

  @IsDecimal()
  @IsNotEmpty()
  hourlyRate: number;

  @ValidateNested()
  @Type(() => Schedule)
  schedule?: Schedule;

  @ValidateNested()
  @Type(() => ContactInfo)
  contactInfo: ContactInfo;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'closed'])
  status: 'active' | 'closed';
}
