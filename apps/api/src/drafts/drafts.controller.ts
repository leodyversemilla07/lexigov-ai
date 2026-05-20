import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
} from "@nestjs/common";
import { DraftsService } from "./drafts.service";
import { CreateDraftDto } from "./dto/create-draft.dto";
import { UpdateDraftDto } from "./dto/update-draft.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("drafts")
@UseGuards(AuthGuard)
export class DraftsController {
    constructor(private readonly draftsService: DraftsService) {}

    @Post()
    create(@Body() dto: CreateDraftDto, @Req() req: any) {
        return this.draftsService.create(dto, req.user.userId);
    }

    @Get()
    findAll(@Req() req: any, @Query("status") status?: string) {
        return this.draftsService.findAll(req.user.userId, status);
    }

    @Get(":id")
    findOne(@Param("id") id: string, @Req() req: any) {
        return this.draftsService.findOne(id, req.user.userId);
    }

    @Post(":id")
    update(
        @Param("id") id: string,
        @Body() dto: UpdateDraftDto,
        @Req() req: any,
    ) {
        return this.draftsService.update(id, dto, req.user.userId);
    }

    @Delete(":id")
    remove(@Param("id") id: string, @Req() req: any) {
        return this.draftsService.remove(id, req.user.userId);
    }

    @Get(":id/versions")
    listVersions(@Param("id") id: string, @Req() req: any) {
        return this.draftsService.listVersions(id, req.user.userId);
    }

    @Get(":id/export")
    exportDraft(
        @Param("id") id: string,
        @Req() req: any,
        @Query("format") format: "txt" | "md" = "txt",
    ) {
        return this.draftsService.exportDraft(id, req.user.userId, format);
    }
}
