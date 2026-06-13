import { IsString, MinLength } from 'class-validator';

export class GenerateSummaryDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
