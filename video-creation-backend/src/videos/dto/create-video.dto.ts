import { IsString, IsOptional, IsArray, IsObject, IsEnum } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  seriesId?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsArray()
  media?: Array<{
    type: string;
    url: string;
    source: string;
  }>;

  @IsOptional()
  @IsObject()
  narration?: {
    voice: string;
    text: string;
    audioUrl: string;
  };

  @IsOptional()
  @IsArray()
  captions?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;

  @IsOptional()
  @IsObject()
  backgroundMusic?: {
    style: string;
    url: string;
  };

  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

