import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';

export class CustomerProfileDto {
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

  @IsString()
  @ApiProperty({ example: 'Upload image image' })
  profilePicture: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @ApiProperty({ type: LocationDto })
  location: LocationDto;
}
