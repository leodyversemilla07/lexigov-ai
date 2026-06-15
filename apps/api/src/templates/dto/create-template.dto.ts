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
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsIn([...templateCategoryValues])
  category!: TemplateCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subcategory?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn([...jurisdictionLevelValues], { each: true })
  jurisdiction!: JurisdictionLevel[];

  @IsObject()
  structure!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  exampleContent?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
