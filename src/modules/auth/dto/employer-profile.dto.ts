import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { plainToClass, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';

export class EmployerProfileDto {
  @IsString()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'john12@gmail.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '+25424545475' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'ABC PLC' })
  companyName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'ABC PLC' })
  preferredContactMethod: string;

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

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'ABC PLC' })
  description: string;
}
