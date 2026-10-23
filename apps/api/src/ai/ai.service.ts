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
  aiComplianceResultSchema,
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

      const rawAiResult = await this.provider.generateStructured<unknown>({
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 2500,
        schema: aiComplianceResultSchema,
        jsonSchema: complianceAnalysisJsonSchema as Record<string, unknown>,
      });

      // Prefer the strict shared contract; fall back to lenient normalization so
      // providers returning legacy field names still contribute findings.
      const strictResult = aiComplianceResultSchema.safeParse(rawAiResult);
      const aiIssues = strictResult.success
        ? strictResult.data.issues
        : (parseComplianceResult(rawAiResult)?.issues ?? []);
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
          'Rewrite this proposed section in clear, formal Philippine legislative terminology without asserting legal validity or compliance.';
        break;
      case 'penalties':
        actionPrompt = `Format or revise the proposed penalty provisions for legal review. Do not exceed the generally applicable RA 7160 ceiling for ${jurisdiction} level absent a separately verified legal basis (Barangay: ₱1,000 fine and no imprisonment; Municipal: ₱2,500 fine and 6 months; City/Province: ₱5,000 fine and 1 year). Do not claim compliance.`;
        break;
      case 'simplify':
        actionPrompt =
          'Improve clarity and conciseness while preserving the supplied policy intent; do not claim enforceability or legal sufficiency.';
        break;
    }

    const systemPrompt = `You are an advisory Philippine legislative drafting assistant, not an attorney or approving authority. Propose refinements to one section of a working-draft ${documentType.toLowerCase()} for a ${jurisdiction} LGU. Do not invent facts or claim legal compliance, approval, enactment, or enforceability. Use bracketed review notes for uncertainty. Return only the proposed section body without repeating the heading.`;

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
