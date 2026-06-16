import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  type JurisdictionLevel,
  jurisdictionLevelValues,
  type TemplateCategory,
  templateCategoryValues,
} from '../../common/contracts';

function toBoolean(value: unknown) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ListTemplatesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsIn([...templateCategoryValues])
  category?: TemplateCategory;

  @IsOptional()
  @IsIn([...jurisdictionLevelValues])
  jurisdiction?: JurisdictionLevel;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  publicOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}
