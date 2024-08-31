import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class AvailabilityDto {
  @IsString()
  @ApiProperty({ example: 'Monday, Wednesday' })
  @Transform(({ value }) => value.split(',').map((day: string) => day.trim()))
  days: string[];

  @IsString()
  @ApiProperty({ example: '9 AM - 5 PM' })
  hours: string;
}
