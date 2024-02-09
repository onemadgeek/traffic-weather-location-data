import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchLocationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  date_time: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  justLog?: boolean;
}
