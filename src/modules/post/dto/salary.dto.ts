import { IsNumber } from 'class-validator';

export class SalaryDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}
