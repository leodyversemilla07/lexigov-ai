import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  type DocumentType,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '../../common/contracts';

type DraftContentInput = Record<string, unknown>;

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
