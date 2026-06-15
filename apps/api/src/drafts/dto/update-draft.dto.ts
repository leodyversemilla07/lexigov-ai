import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { type DocumentStatus, documentStatusValues } from '../../common/contracts';
import { CreateDraftDto } from './create-draft.dto';

export class UpdateDraftDto extends PartialType(CreateDraftDto) {
  @IsOptional()
  @IsIn([...documentStatusValues])
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  commitMessage?: string;
}
