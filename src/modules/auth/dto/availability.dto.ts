import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class AvailabilityDto {
  @IsString({ each: true })
  @ApiProperty({ example: ['Monday', 'Wednesday'] })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item: string) => item.trim());
    }
    return Array.isArray(value) ? value : undefined;
  })
  days: string[];

  @IsString()
  @ApiProperty({ example: '9 AM - 5 PM' })
  hours: string;
}
