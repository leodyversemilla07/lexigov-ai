import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';
import type { CheckComplianceDto } from './dto/check-compliance.dto';
import type { GenerateOrdinanceDto } from './dto/generate-ordinance.dto';
import type { GenerateSummaryDto } from './dto/generate-summary.dto';

/**
 * AI endpoints hit Azure OpenAI and are billed per token.
 * The 'ai' tier is configured globally in AppModule (10 req/min/user).
 */
@Controller('ai')
@UseGuards(AuthGuard)
@Throttle({ ai: { limit: 10, ttl: 60_000 } })
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

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
