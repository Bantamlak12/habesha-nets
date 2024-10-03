import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from './location.dto';
import { SalaryDto } from './salary.dto';
import { Type } from 'class-transformer';

export class EmployeeUpdatePostDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  jobType: string;

  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary: SalaryDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills: string[];

  @IsOptional()
  @IsString()
  experienceLevel: string;

  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline: Date;

  @IsOptional()
  @IsIn(['active', 'closed'])
  status: 'active' | 'closed';
}
