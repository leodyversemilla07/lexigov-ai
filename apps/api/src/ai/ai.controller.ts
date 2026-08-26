import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';
import { AssistSectionDto } from './dto/assist-section.dto';
import { CheckComplianceDto } from './dto/check-compliance.dto';
import { GenerateOrdinanceDto } from './dto/generate-ordinance.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';

/**
 * AI endpoints hit Azure OpenAI and are billed per token.
 * Override the default API throttle with a tighter 10 req/min/user cap.
 */
@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Post('generate-ordinance')
  @ApiOperation({ summary: 'Generate an ordinance draft using AI' })
  @ApiResponse({ status: 201, description: 'Ordinance generated' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  generateOrdinance(@Body() dto: GenerateOrdinanceDto) {
    return this.aiService.generateOrdinance(dto.prompt, dto.jurisdiction, dto.jurisdictionName, dto.documentType);
  }

  @Post('generate-ordinance/stream')
  @ApiOperation({ summary: 'Stream an ordinance draft generation using Server-Sent Events (SSE)' })
  @ApiResponse({ status: 200, description: 'SSE stream of generated tokens' })
  async generateOrdinanceStream(@Body() dto: GenerateOrdinanceDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const chunk of this.aiService.generateOrdinanceStream(
        dto.prompt,
        dto.jurisdiction,
        dto.jurisdictionName,
        dto.documentType,
      )) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  }

  @Post('assist-section')
  @ApiOperation({ summary: 'Generate section-level AI refinements' })
  @ApiResponse({ status: 201, description: 'Section content improved' })
  assistSection(@Body() dto: AssistSectionDto) {
    return this.aiService.assistSection(
      dto.sectionHeading,
      dto.sectionBody,
      dto.action,
      dto.instruction,
      dto.jurisdiction,
      dto.documentType,
    );
  }

  @Post('check-compliance')
  @ApiOperation({ summary: 'Check draft compliance against RA 7160' })
  @ApiResponse({ status: 201, description: 'Compliance analysis completed' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  checkCompliance(@Body() dto: CheckComplianceDto) {
    return this.aiService.checkCompliance(dto.content, dto.jurisdiction);
  }

  @Post('generate-summary')
  @ApiOperation({ summary: 'Generate a summary for a draft' })
  @ApiResponse({ status: 201, description: 'Summary generated' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  generateSummary(@Body() dto: GenerateSummaryDto) {
    return this.aiService.generateSummary(dto.content);
  }
}

