import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AiService } from './ai.service';
import type { CheckComplianceDto } from './dto/check-compliance.dto';
import type { GenerateOrdinanceDto } from './dto/generate-ordinance.dto';
import type { GenerateSummaryDto } from './dto/generate-summary.dto';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-ordinance')
  generateOrdinance(@Body() dto: GenerateOrdinanceDto) {
    return this.aiService.generateOrdinance(dto.prompt, dto.jurisdiction, dto.jurisdictionName, dto.documentType);
  }

  @Post('check-compliance')
  checkCompliance(@Body() dto: CheckComplianceDto) {
    return this.aiService.checkCompliance(dto.content, dto.jurisdiction);
  }

  @Post('generate-summary')
  generateSummary(@Body() dto: GenerateSummaryDto) {
    return this.aiService.generateSummary(dto.content);
  }
}
