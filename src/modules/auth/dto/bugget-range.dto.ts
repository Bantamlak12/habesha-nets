import { IsNumber } from 'class-validator';

export class BudgetRangeDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}
