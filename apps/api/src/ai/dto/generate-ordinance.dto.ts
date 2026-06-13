import {
  type DocumentType,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '@lexigov/shared';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateOrdinanceDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  prompt!: string;

  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;

  @IsString()
  @MinLength(1)
  jurisdictionName!: string;

  @IsIn([...documentTypeValues])
  documentType!: DocumentType;
}
