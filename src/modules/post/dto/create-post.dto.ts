import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LocationDto } from './location.dto';
import { SalaryDto } from './salary.dto';

export class JobPostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  jobType: string;

  @IsString()
  companyName: string;

  @IsString()
  location: LocationDto;

  @IsNumber()
  salary: SalaryDto;

  @IsOptional()
  @IsArray()
  requiredSkills: string[];

  @IsOptional()
  @IsString()
  experienceLevel: string;

  @IsString()
  category: string;

  @IsDateString()
  applicationDeadline: Date;

  @IsIn(['active', 'closed'])
  status: 'active' | 'closed';
}
