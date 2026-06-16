import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  type DocumentStatus,
  type DocumentType,
  documentStatusValues,
  documentTypeValues,
} from '../../common/contracts';

export class ListDraftsDto {
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
  @IsIn([...documentStatusValues])
  status?: DocumentStatus;

  @IsOptional()
  @IsIn([...documentTypeValues])
  documentType?: DocumentType;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}
