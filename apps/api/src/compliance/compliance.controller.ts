import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard)
export class ComplianceController {
  constructor(@Inject(ComplianceService) private readonly complianceService: ComplianceService) {}

  @Post(':draftId/check')
  checkDraft(@Param('draftId') draftId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.checkDraft(draftId, user.userId);
  }

  @Get(':draftId')
  getReports(@Param('draftId') draftId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.getReports(draftId, user.userId);
  }
}
