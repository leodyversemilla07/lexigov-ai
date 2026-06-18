import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  type JurisdictionLevel,
  jurisdictionLevelValues,
  type TemplateCategory,
  templateCategoryValues,
} from '../../common/contracts';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: [...templateCategoryValues], description: 'Template category' })
  @IsIn([...templateCategoryValues])
  category!: TemplateCategory;

  @ApiPropertyOptional({ description: 'Subcategory / focus area', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subcategory?: string;

  @ApiProperty({ enum: [...jurisdictionLevelValues], isArray: true, description: 'Applicable jurisdiction levels' })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn([...jurisdictionLevelValues], { each: true })
  jurisdiction!: JurisdictionLevel[];

  @ApiProperty({ description: 'Template structure / sections' })
  @IsObject()
  structure!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Example content for previews' })
  @IsOptional()
  @IsObject()
  exampleContent?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
