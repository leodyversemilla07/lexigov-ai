import { IsString } from 'class-validator';

export class CheckComplianceDto {
  @IsString()
  content!: string;

  @IsString()
  jurisdiction!: string;
}
