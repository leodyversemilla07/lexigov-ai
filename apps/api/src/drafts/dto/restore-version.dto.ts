import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsInt, IsString, Min, MinLength } from 'class-validator';

export class RestoreVersionDto {
  @IsString()
  @MinLength(1)
  versionId!: string;

  @ApiProperty({ description: 'Required current root-draft version', minimum: 1 })
  @IsDefined()
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
