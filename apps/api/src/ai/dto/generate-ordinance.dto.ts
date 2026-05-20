import { IsString } from 'class-validator';

export class GenerateOrdinanceDto {
  @IsString()
  prompt!: string;

  @IsString()
  jurisdiction!: string;

  @IsString()
  jurisdictionName!: string;

  @IsString()
  documentType!: string;
}
