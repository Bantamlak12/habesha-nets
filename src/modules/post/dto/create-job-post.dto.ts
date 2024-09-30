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

export class EmployeeCreatePostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  jobType: string;

  @IsString()
  companyName: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => SalaryDto)
  salary: SalaryDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills: string[];

  @IsString()
  experienceLevel: string;

  @IsString()
  category: string;

  @IsDateString()
  applicationDeadline: Date;

  @IsIn(['active', 'closed'])
  status: 'active' | 'closed';
}
