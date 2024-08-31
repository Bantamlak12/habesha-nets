import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsEnum,
  IsDecimal,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToClass } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { QualificationDto } from './qualification.dto';
import { ExperienceDto } from './experience.dto';
import { AvailabilityDto } from './availability.dto';

export class FreelancerProfileDto {
  @IsString()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ example: 'john12@gmail.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '+25424545475' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ example: 'Web Developer' })
  profession: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['HTML', 'CSS', 'JavaScript'] })
  @Transform(({ value }) => value.split(',').map((item: string) => item.trim()))
  skills: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QualificationDto)
  @ApiProperty({ type: [QualificationDto] })
  qualifications: QualificationDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @ApiProperty({ type: [ExperienceDto] })
  experience: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['http://portfolio1.com', 'http://portfolio2.com'],
  })
  @Transform(({ value }) => value.split(',').map((item: string) => item.trim()))
  portfolioLinks: string[];

  @IsOptional()
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Portfolio file uploads',
  })
  portfolioFiles: any;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'A passionate web developer with 5 years of experience...',
  })
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['English', 'Spanish'] })
  @Transform(({ value }) => value.split(',').map((item: string) => item.trim()))
  languages: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @ApiProperty({ type: AvailabilityDto })
  availability: AvailabilityDto;

  @IsOptional()
  @IsDecimal()
  @ApiProperty({ example: 50.0 })
  hourlyRate: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsedValue = JSON.parse(value);
        return plainToClass(LocationDto, parsedValue);
      } catch (error) {
        throw new Error(`Invalid JSON format for location. ${error}`);
      }
    }
    return value;
  })
  @ApiProperty({ type: LocationDto })
  location: LocationDto;

  @IsEnum(['Phone', 'Email', 'SMS'])
  @ApiProperty({ example: 'Email' })
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';
}
