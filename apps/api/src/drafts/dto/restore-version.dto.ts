import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RestoreVersionDto {
  @IsString()
  @MinLength(1)
  versionId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}
