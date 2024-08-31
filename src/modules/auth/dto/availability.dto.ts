import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AvailabilityDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['Monday', 'Wednesday'] })
  days: string[];

  @IsString()
  @ApiProperty({ example: '9 AM - 5 PM' })
  hours: string;
}
