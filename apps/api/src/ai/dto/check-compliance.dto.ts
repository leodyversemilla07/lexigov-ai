import { type JurisdictionLevel, jurisdictionLevelValues } from '@lexigov/shared';
import { IsIn, IsString, MinLength } from 'class-validator';

export class CheckComplianceDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;
}
