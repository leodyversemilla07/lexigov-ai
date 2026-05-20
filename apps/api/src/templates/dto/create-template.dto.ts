import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsArray()
  @IsString({ each: true })
  jurisdiction!: string[];

  @IsOptional()
  structure?: any;

  @IsOptional()
  exampleContent?: any;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
