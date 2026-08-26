import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  type DocumentType,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '../../common/contracts';

export const assistActionValues = ['expand', 'formalize', 'penalties', 'simplify'] as const;
export type AssistAction = (typeof assistActionValues)[number];

export class AssistSectionDto {
  @ApiProperty({ description: 'Section heading, e.g. SECTION 3. Penalties' })
  @IsString()
  @MinLength(1)
  sectionHeading!: string;

  @ApiProperty({ description: 'Current body text of the section' })
  @IsString()
  sectionBody!: string;

  @ApiProperty({ enum: [...assistActionValues], description: 'Action to perform' })
  @IsIn([...assistActionValues])
  action!: AssistAction;

  @ApiPropertyOptional({ description: 'Optional custom instruction for the AI' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string;

  @ApiProperty({ enum: [...jurisdictionLevelValues], description: 'Jurisdiction level' })
  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;

  @ApiProperty({ enum: [...documentTypeValues], description: 'Type of document' })
  @IsIn([...documentTypeValues])
  documentType!: DocumentType;
}
