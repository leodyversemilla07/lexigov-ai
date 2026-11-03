import { Controller, Get, Inject, NotFoundException, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { hasOrganizationResourceAccess } from '../auth/organization-access';
import { PrismaService } from '../prisma/prisma.service';
import { ARTIFACT_STORAGE } from './artifact.constants';
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
  constructor(
    @Inject(ARTIFACT_STORAGE) private readonly artifactStorage: ArtifactStorage,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get('*')
  @ApiOperation({ summary: 'Retrieve a stored artifact by key' })
  @ApiResponse({ status: 200, description: 'Artifact content' })
  @ApiResponse({ status: 404, description: 'Artifact not found' })
  async get(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const key = this.requestKey(request);
    const match = /^exports\/([^/]+)\/v(\d+)\.(txt|md|docx|pdf)$/.exec(key);
    if (!match) throw new NotFoundException('Artifact not found');

    const draft = await this.prisma.draft.findUnique({ where: { id: match[1] } });
    if (
      !draft ||
      draft.deletedAt ||
      !(await hasOrganizationResourceAccess(this.prisma, draft.organizationId, draft.userId, user.userId))
    ) {
      throw new NotFoundException('Artifact not found');
    }

    const data = await this.artifactStorage.get(key).catch(() => {
      throw new NotFoundException('Artifact not found');
    });
    res.setHeader('Content-Type', CONTENT_TYPE_BY_EXTENSION[this.extensionOf(key)] ?? 'application/octet-stream');
    return data;
  }

  private requestKey(request: Request): string {
    const wildcard = request.params?.[0];
    return typeof wildcard === 'string' ? wildcard.replace(/^\/+/, '') : '';
  }

  private extensionOf(key: string): string {
    const match = /\.([a-z0-9]+)$/i.exec(key);
    return match ? `.${match[1]?.toLowerCase()}` : '';
  }
}
