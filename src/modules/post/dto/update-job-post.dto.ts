import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Schedule } from './schedule.dto';
import { ContactInfo } from './contact.dto';
import { Location } from './location.dto';

export class UpdateJobPostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  location: Location;

  @IsOptional()
  @IsBoolean()
  @IsOptional()
  remote?: boolean;

  @IsOptional()
  @IsDecimal()
  @IsNotEmpty()
  hourlyRate: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Schedule)
  schedule?: Schedule;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfo)
  contactInfo: ContactInfo;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'closed'])
  status: 'active' | 'closed';
}
