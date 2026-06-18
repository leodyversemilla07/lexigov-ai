import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  type DocumentType,
  documentTypeValues,
  type JurisdictionLevel,
  jurisdictionLevelValues,
} from '../../common/contracts';

export class GenerateOrdinanceDto {
  @ApiProperty({ description: 'Description of the ordinance to generate', minLength: 10, maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  prompt!: string;

  @ApiProperty({ enum: [...jurisdictionLevelValues], description: 'Jurisdiction level' })
  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;

  @ApiProperty({ description: 'Name of the LGU / jurisdiction' })
  @IsString()
  @MinLength(1)
  jurisdictionName!: string;

  @ApiProperty({ enum: [...documentTypeValues], description: 'Type of document to generate' })
  @IsIn([...documentTypeValues])
  documentType!: DocumentType;
}
