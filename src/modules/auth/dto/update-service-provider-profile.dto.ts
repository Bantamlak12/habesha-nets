import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsDecimal,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToClass } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';
import { QualificationDto } from './qualification.dto';
import { ExperienceDto } from './experience.dto';
import { AvailabilityDto } from './availability.dto';

export class updateServiceProvidersDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  secondaryEmail: string;

  @IsOptional()
  @IsString()
  secondaryPhoneNumber: string;

  @IsOptional()
  @IsString()
  profession: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(AddressDto, parsedValue);
    }
    return value;
  })
  address: AddressDto;

  @IsOptional()
  @IsString()
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @IsOptional()
  @IsString()
  serviceCategory: string;

  @IsOptional()
  @IsString()
  serviceTitle: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @ApiProperty({ type: [ExperienceDto] })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(ExperienceDto, parsedValue);
    }
    return value;
  })
  experience: ExperienceDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QualificationDto)
  @ApiProperty({ type: QualificationDto })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(QualificationDto, parsedValue);
    }
    return value;
  })
  qualifications: QualificationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item: string) => item.trim());
    }
    return Array.isArray(value) ? value : undefined;
  })
  skills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return Array.isArray(value) ? value : undefined;
  })
  portfolioLinks: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(AvailabilityDto, parsedValue);
    }
    return value;
  })
  availability: AvailabilityDto;

  @IsOptional()
  @IsDecimal()
  hourlyRate: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item: string) => item.trim());
    }
    return Array.isArray(value) ? value : undefined;
  })
  languages: string[];
}
