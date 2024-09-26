import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @IsString()
  @ApiProperty({
    example: '1234 Main St',
    description: 'Street address or P.O. Box',
  })
  streetAddress: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Apt 101, Suite 3B, Unit 2',
    description: 'Apartment, Suite, Unit, or Building number (optional)',
  })
  secondaryAddress?: string;

  @IsString()
  @ApiProperty({ example: 'Los Angeles', description: 'City name' })
  city: string;

  @IsString()
  @ApiProperty({ example: 'California', description: 'State or province name' })
  state: string;

  @IsString()
  @ApiProperty({
    example: 'USA',
    description: 'Country',
  })
  country: string;

  @IsString()
  @ApiProperty({ example: '60601', description: 'Zip code' })
  zipcode: string;
}
