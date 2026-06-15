import { Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard)
export class ComplianceController {
  constructor(@Inject(ComplianceService) private readonly complianceService: ComplianceService) {}

  @Post(':draftId/check')
  checkDraft(@Param('draftId') draftId: string, @Req() req: any) {
    return this.complianceService.checkDraft(draftId, req.user.userId);
  }

  @Get(':draftId')
  getReports(@Param('draftId') draftId: string, @Req() req: any) {
    return this.complianceService.getReports(draftId, req.user.userId);
  }
}
