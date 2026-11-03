import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { type JurisdictionLevel, jurisdictionLevelValues } from '../../common/contracts';

export class CheckComplianceDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsIn([...jurisdictionLevelValues])
  jurisdiction!: JurisdictionLevel;
}
