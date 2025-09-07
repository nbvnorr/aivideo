import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: string;
}

