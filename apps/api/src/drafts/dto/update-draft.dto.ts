import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { type DocumentStatus, documentStatusValues } from '../../common/contracts';
import { CreateDraftDto } from './create-draft.dto';

export class UpdateDraftDto extends PartialType(CreateDraftDto) {
  @ApiPropertyOptional({ enum: [...documentStatusValues], description: 'Updated document status' })
  @IsOptional()
  @IsIn([...documentStatusValues])
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Commit message for this change', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  commitMessage?: string;
}
