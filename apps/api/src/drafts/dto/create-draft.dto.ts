import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  documentType!: string;

  @IsString()
  jurisdiction!: string;

  @IsString()
  jurisdictionName!: string;

  @IsOptional()
  content?: any;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsString()
  templateId?: string;
}
