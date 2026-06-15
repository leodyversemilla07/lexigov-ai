import { IsIn, IsString, MinLength } from 'class-validator';
import { type JurisdictionLevel, jurisdictionLevelValues } from '../../common/contracts';

export class CheckComplianceDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;
}
