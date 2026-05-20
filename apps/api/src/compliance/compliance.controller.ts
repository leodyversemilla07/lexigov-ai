import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Req,
} from "@nestjs/common";
import { ComplianceService } from "./compliance.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("compliance")
@UseGuards(AuthGuard)
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) {}

    @Post(":draftId/check")
    checkDraft(@Param("draftId") draftId: string, @Req() req: any) {
        return this.complianceService.checkDraft(draftId, req.user.userId);
    }

    @Get(":draftId")
    getReports(@Param("draftId") draftId: string, @Req() req: any) {
        return this.complianceService.getReports(draftId, req.user.userId);
    }
}
