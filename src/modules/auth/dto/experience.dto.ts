import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ExperienceDto {
  @IsString()
  @ApiProperty({ example: 'Software Engineer' })
  position: string;

  @IsString()
  @ApiProperty({ example: '3 years' })
  yearsOfExperience: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['Developed web applications', 'Led a team of developers'],
    type: [String],
  })
  responsibilities: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Tech Corp' })
  company?: string;

  @IsOptional()
  @ApiProperty({ example: '2020-01-01' })
  startDate?: Date;

  @IsOptional()
  @ApiProperty({ example: '2023-01-01' })
  endDate?: Date;
}
