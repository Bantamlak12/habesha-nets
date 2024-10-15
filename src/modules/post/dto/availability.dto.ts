import { IsString } from 'class-validator';

export class Availability {
  @IsString()
  from: string;

  @IsString()
  until: string;
}
