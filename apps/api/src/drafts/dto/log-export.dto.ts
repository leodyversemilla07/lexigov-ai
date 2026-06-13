import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class LogExportDto {
  @IsString()
  @IsIn(['txt', 'md', 'docx', 'pdf'])
  format!: 'txt' | 'md' | 'docx' | 'pdf';

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pageCount?: number;
}
