import { plainToClass, Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { BudgetRangeDto } from './bugget-range.dto';

export class UpdatePropertyRenterDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(AddressDto, parsedValue);
    }
    return value;
  })
  address: AddressDto;

  @IsOptional()
  @IsString()
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetRangeDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      return plainToClass(BudgetRangeDto, parsedValue);
    }
    return value;
  })
  budgetRange: BudgetRangeDto;
}
