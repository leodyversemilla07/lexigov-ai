import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  type DocumentStatus,
  type DocumentType,
  documentStatusValues,
  documentTypeValues,
} from '../../common/contracts';

export class ListDraftsDto {
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

  @ApiPropertyOptional({ enum: [...documentStatusValues], description: 'Filter by status' })
  @IsOptional()
  @IsIn([...documentStatusValues])
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: [...documentTypeValues], description: 'Filter by document type' })
  @IsOptional()
  @IsIn([...documentTypeValues])
  documentType?: DocumentType;

  @ApiPropertyOptional({ description: 'Filter by organization / Sanggunian LGU ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Search query (matches title)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}
