import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @IsString()
  @ApiProperty({ example: 'Los Angeles' })
  city: string;

  @IsString()
  @ApiProperty({ example: 'California' })
  state: string;

  @IsString()
  @ApiProperty({ example: 'USA' })
  country: string;
}
