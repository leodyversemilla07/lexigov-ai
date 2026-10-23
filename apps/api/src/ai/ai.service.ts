import {
  type AiProvider,
  buildComplianceAnalysisPrompt,
  buildOrdinanceDraftingPrompt,
  buildSummaryPrompt,
  createAiProviderFromEnv,
  createStatutoryRAGFromEnv,
  type StatutoryRAG,
  type StatutoryVectorStore,
} from '@lexigov/ai';
import {
  analyzeDeterministicCompliance,
  buildComplianceResultFromIssues,
  complianceAnalysisJsonSchema,
  mergeComplianceIssues,
  parseComplianceResult,
} from '@lexigov/shared';
import { Inject, Injectable } from '@nestjs/common';
import { isJurisdictionLevel } from '../common/contracts';
import { STATUTORY_VECTOR_STORE } from './ai.constants';

@Injectable()
export class AiService {
  private provider: AiProvider;
  private readonly statutoryRAG: StatutoryRAG;

  constructor(@Inject(STATUTORY_VECTOR_STORE) statutoryStore: StatutoryVectorStore) {
    this.provider = createAiProviderFromEnv(process.env);
    this.statutoryRAG = createStatutoryRAGFromEnv(process.env, statutoryStore);
  }

  setProvider(provider: AiProvider): void {
    this.provider = provider;
  }

  getProvider(): AiProvider {
    return this.provider;
  }

  async generateOrdinance(prompt: string, jurisdiction: string, jurisdictionName: string, documentType: string) {
    const retrieval = await this.statutoryRAG.retrieve(prompt, 3);
    const { systemPrompt, userPrompt } = buildOrdinanceDraftingPrompt({
      prompt,
      jurisdiction,
      jurisdictionName,
      documentType,
      statutoryContext: retrieval.context || undefined,
    });

    const result = await this.provider.generateText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 8192,
    });

    return {
      content: result.text,
      generatedAt: Date.now(),
      model: result.model,
    };
  }

  async checkCompliance(content: string, jurisdiction: string) {
    // For unknown jurisdictions, skip the AI augmentation path entirely.
    if (!isJurisdictionLevel(jurisdiction)) {
      return { overallScore: 0, isValid: false, issues: [] };
    }

    const deterministic = analyzeDeterministicCompliance(content, jurisdiction);

    try {
      const { systemPrompt, userPrompt } = buildComplianceAnalysisPrompt(content, jurisdiction);

      const aiResult = await this.provider.generateStructured<unknown>({
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 2500,
        jsonSchema: complianceAnalysisJsonSchema as Record<string, unknown>,
      });

      // Normalize the (provider-supplied) payload into canonical compliance issues
      // before merging with the deterministic RA 7160 analysis.
      const parsed = parseComplianceResult(aiResult);
      const aiIssues = parsed ? parsed.issues : [];
      const merged = mergeComplianceIssues(deterministic.issues, aiIssues);
      return buildComplianceResultFromIssues(merged);
    } catch {
      // Fall back to deterministic analysis
      return deterministic;
    }
  }

  async generateSummary(content: string) {
    const { systemPrompt, userPrompt } = buildSummaryPrompt(content);

    const result = await this.provider.generateText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 1024,
    });

    return { summary: result.text };
  }

  async *generateOrdinanceStream(
    prompt: string,
    jurisdiction: string,
    jurisdictionName: string,
    documentType: string,
  ): AsyncGenerator<string, void, unknown> {
    const retrieval = await this.statutoryRAG.retrieve(prompt, 3);
    const { systemPrompt, userPrompt } = buildOrdinanceDraftingPrompt({
      prompt,
      jurisdiction,
      jurisdictionName,
      documentType,
      statutoryContext: retrieval.context || undefined,
    });

    const stream = this.provider.streamText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 8192,
    });

    for await (const token of stream) {
      yield token;
    }
  }

  async assistSection(
    sectionHeading: string,
    sectionBody: string,
    action: 'expand' | 'formalize' | 'penalties' | 'simplify',
    instruction?: string,
    jurisdiction = 'barangay',
    documentType = 'ORDINANCE',
  ) {
    let actionPrompt = '';
    switch (action) {
      case 'expand':
        actionPrompt =
          'Expand this section with detailed operative provisions, clear administrative definitions, and comprehensive procedural steps.';
        break;
      case 'formalize':
        actionPrompt =
          'Rewrite this section in formal Philippine statutory and legislative terminology (Republic Act / Local Government Code standard).';
        break;
      case 'penalties':
        actionPrompt = `Format or revise the penalty provisions in this section to strictly comply with RA 7160 limits for ${jurisdiction} level (Barangay: max ₱1,000 fine, no imprisonment; Municipal: max ₱2,500 fine, max 6 mos; City/Province: max ₱5,000 fine, max 1 yr).`;
        break;
      case 'simplify':
        actionPrompt =
          'Improve clarity and conciseness of this section while preserving full legal precision and enforceability.';
        break;
    }

    const systemPrompt = `You are an expert Philippine legislative drafter helping refine an individual section of a ${documentType.toLowerCase()} for a ${jurisdiction} LGU. Return ONLY the improved section body text (without repeating the heading itself).`;

    const userPrompt = `Section Heading: ${sectionHeading}\nCurrent Section Body:\n${sectionBody || '(No content yet)'}\n\nTask: ${actionPrompt}${instruction ? `\nAdditional user instruction: ${instruction}` : ''}`;

    const result = await this.provider.generateText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 2048,
    });

    return {
      sectionBody: result.text.trim(),
      action,
      model: result.model,
    };
  }
}
