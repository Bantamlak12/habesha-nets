import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class QualificationDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['BSc in Computer Science'] })
  degrees: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['Certified JavaScript Developer'] })
  certifications: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['Advanced React Trainig'] })
  trainings: string[];
}
