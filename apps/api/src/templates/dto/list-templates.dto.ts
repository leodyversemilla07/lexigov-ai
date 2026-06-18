import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: [...templateCategoryValues], description: 'Filter by category' })
  @IsOptional()
  @IsIn([...templateCategoryValues])
  category?: TemplateCategory;

  @ApiPropertyOptional({ enum: [...jurisdictionLevelValues], description: 'Filter by jurisdiction' })
  @IsOptional()
  @IsIn([...jurisdictionLevelValues])
  jurisdiction?: JurisdictionLevel;

  @ApiPropertyOptional({ description: 'Show public templates only' })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: 'Search query (matches name, category, description)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}
