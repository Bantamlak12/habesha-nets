import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;
  
  @IsOptional()
  @IsNotEmpty()
  description?: string;
  categoryId?: string;
}
