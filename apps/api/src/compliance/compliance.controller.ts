import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('compliance')
@UseGuards(AuthGuard)
export class ComplianceController {
  constructor(@Inject(ComplianceService) private readonly complianceService: ComplianceService) {}

  @Post(':draftId/check')
  @ApiOperation({ summary: 'Run compliance check on a draft against RA 7160' })
  @ApiResponse({ status: 201, description: 'Compliance check completed' })
  checkDraft(@Param('draftId') draftId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.checkDraft(draftId, user.userId);
  }

  @Get(':draftId')
  @ApiOperation({ summary: 'Get compliance reports for a draft' })
  getReports(@Param('draftId') draftId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.getReports(draftId, user.userId);
  }
}
