import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  type DocumentType,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '../../common/contracts';

type DraftContentInput = Record<string, unknown>;

export class CreateDraftDto {
  @ApiProperty({ description: 'Draft title', minLength: 5, maxLength: 500 })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title!: string;

  @ApiProperty({ enum: [...documentTypeValues], description: 'Type of document' })
  @IsIn([...documentTypeValues])
  documentType!: DocumentType;

  @ApiProperty({ enum: [...jurisdictionLevelValues], description: 'Jurisdiction level' })
  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;

  @ApiProperty({ description: 'Name of the LGU / jurisdiction' })
  @IsString()
  @MinLength(1)
  jurisdictionName!: string;

  @ApiPropertyOptional({ description: 'Initial draft content' })
  @IsOptional()
  @IsObject()
  content?: DraftContentInput;

  @ApiPropertyOptional({ description: 'Whether this draft was AI-generated' })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @ApiPropertyOptional({ description: 'Template ID used to create this draft' })
  @IsOptional()
  @IsString()
  templateId?: string;
}
