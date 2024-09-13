import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class QualificationDto {
  @IsString()
  @ApiProperty({ example: 'BSc in Computer Science' })
  degree: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['Certified JavaScript Developer', 'Certified Python Developer'],
  })
  certifications: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['Advanced React Trainig', 'Advanced Odoo Trainig'] })
  trainings: string[];
}
