import { IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateSummaryDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsString()
  @MinLength(1)
  content!: string;
}
