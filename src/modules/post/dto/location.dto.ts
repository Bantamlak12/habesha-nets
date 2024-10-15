import { IsString } from 'class-validator';

export class Location {
  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  street: string;

  @IsString()
  postalCode: string;
}
