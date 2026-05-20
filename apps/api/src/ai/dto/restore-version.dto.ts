import { IsString } from 'class-validator';

export class RestoreVersionDto {
  @IsString()
  versionId!: string;
}
