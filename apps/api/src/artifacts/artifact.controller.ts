import { Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ARTIFACT_STORAGE } from './artifact.module';
import type { ArtifactStorage } from './artifact-storage.service';

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
};

@ApiTags('Artifacts')
@ApiBearerAuth()
@Controller('artifacts')
@UseGuards(AuthGuard)
export class ArtifactController {
  constructor(@Inject(ARTIFACT_STORAGE) private readonly artifactStorage: ArtifactStorage) {}

  @Get(':key')
  @ApiOperation({ summary: 'Retrieve a stored artifact by key' })
  @ApiResponse({ status: 200, description: 'Artifact content' })
  @ApiResponse({ status: 404, description: 'Artifact not found' })
  async get(@Param('key') key: string, @Res({ passthrough: true }) res: Response) {
    const data = await this.artifactStorage.get(key);
    res.setHeader('Content-Type', CONTENT_TYPE_BY_EXTENSION[this.extensionOf(key)] ?? 'application/octet-stream');
    return data;
  }

  private extensionOf(key: string): string {
    const match = /\.([a-z0-9]+)$/i.exec(key);
    return match ? `.${match[1]?.toLowerCase()}` : '';
  }
}
