import {
  type DocumentType,
  type DraftContentInput,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '@lexigov/shared';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title!: string;

  @IsIn([...documentTypeValues])
  documentType!: DocumentType;

  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;

  @IsString()
  @MinLength(1)
  jurisdictionName!: string;

  @IsOptional()
  @IsObject()
  content?: DraftContentInput;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsString()
  templateId?: string;
}
