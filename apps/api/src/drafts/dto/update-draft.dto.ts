import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { type DocumentStatus, documentStatusValues } from '../../common/contracts';

type DraftContentInput = Record<string, unknown>;

export class UpdateDraftDto {
  @ApiPropertyOptional({ description: 'Updated draft title', minLength: 5, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated structured draft content' })
  @IsOptional()
  @IsObject()
  content?: DraftContentInput;

  @ApiPropertyOptional({ enum: [...documentStatusValues], description: 'Updated document status' })
  @IsOptional()
  @IsIn([...documentStatusValues])
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Commit message for this change', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  commitMessage?: string;

  @ApiPropertyOptional({ description: 'SHA-256 document content hash' })
  @IsOptional()
  @IsString()
  documentHash?: string;

  @ApiPropertyOptional({ description: 'Expected draft version for optimistic concurrency control' })
  @IsOptional()
  expectedVersion?: number;
}
