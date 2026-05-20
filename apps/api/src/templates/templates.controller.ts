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
import { TemplatesService } from "./templates.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("templates")
@UseGuards(AuthGuard)
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) {}

    @Post()
    create(@Body() dto: CreateTemplateDto, @Req() req: any) {
        return this.templatesService.create(dto, req.user.userId);
    }

    @Get()
    findAll(@Query("category") category?: string) {
        return this.templatesService.findAll(category);
    }

    @Get(":id")
    findOne(@Param("id") id: string, @Req() req: any) {
        return this.templatesService.findOne(id, req.user?.userId);
    }

    @Post(":id")
    update(
        @Param("id") id: string,
        @Body() dto: UpdateTemplateDto,
        @Req() req: any,
    ) {
        return this.templatesService.update(id, dto, req.user.userId);
    }

    @Delete(":id")
    remove(@Param("id") id: string, @Req() req: any) {
        return this.templatesService.remove(id, req.user.userId);
    }

    @Post(":id/usage")
    incrementUsage(@Param("id") id: string) {
        return this.templatesService.incrementUsage(id);
    }
}
