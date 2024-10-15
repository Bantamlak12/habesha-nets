import { IsOptional, IsString } from 'class-validator';

export class Schedule {
  @IsString()
  start: string;

  @IsOptional()
  @IsString()
  end: string;

  @IsOptional()
  @IsString()
  preferredHours: string;
}
