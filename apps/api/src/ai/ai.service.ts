import {
  analyzeDeterministicCompliance,
  buildComplianceResultFromIssues,
  type ComplianceIssue,
  getStatutoryCitations,
  mergeComplianceIssues,
} from '@lexigov/shared';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { isJurisdictionLevel, type JurisdictionLevel } from '../common/contracts';

interface AzureConfig {
  apiKey: string;
  apiVersion: string;
  deployment: string;
  endpoint: string;
}

@Injectable()
export class AiService {
  private getConfig(): AzureConfig {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!apiKey || !endpoint || !apiVersion || !deployment) {
      throw new ServiceUnavailableException('Azure OpenAI not configured');
    }

    return { apiKey, apiVersion, deployment, endpoint };
  }

  async generateOrdinance(prompt: string, jurisdiction: string, jurisdictionName: string, documentType: string) {
    const config = this.getConfig();
    const { AzureOpenAI } = await import('openai');

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      endpoint: config.endpoint,
    });

    const normalizedJurisdiction = isJurisdictionLevel(jurisdiction) ? jurisdiction : 'barangay';
    const citations = getStatutoryCitations(prompt, normalizedJurisdiction);
    const citationContext = citations
      .map((c) => `- ${c.source} ${c.provision} (${c.title}): ${c.relevance}`)
      .join('\n');

    const systemPrompt = `You are an expert Philippine legislative drafting assistant. Generate an official, legally sound ${documentType.toLowerCase()} for ${jurisdictionName} (${normalizedJurisdiction} level) conforming strictly to Republic Act No. 7160 (Local Government Code of 1991).

Statutory Grounding References:
${citationContext}

Document Requirements:
1. Republic Header ("REPUBLIC OF THE PHILIPPINES", Jurisdiction name, "OFFICE OF THE SANGGUNIAN")
2. Formal Document Title (e.g. "ORDINANCE NO. 2025-___")
3. Formal Preamble with WHEREAS clauses citing relevant statutory bases (RA 7160 § 16, Constitution, DILG guidelines)
4. Enacting Clause ("BE IT ORDAINED, by the Sanggunian in session assembled...")
5. Standard Sections: Title, Declaration of Policy, Definitions, Operative Provisions, Penal Provisions (strictly obeying ${jurisdiction} limits), Administrative Enforcement, Separability Clause, Repealing Clause, Effectivity Clause.`;

    const completion = await client.chat.completions.create({
      model: config.deployment,
      max_completion_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    return {
      content: completion.choices[0]?.message?.content ?? '',
      generatedAt: Date.now(),
      model: config.deployment,
    };
  }

  async checkCompliance(content: string, jurisdiction: string) {
    // For unknown jurisdictions, skip the AI augmentation path entirely. The
    // shared deterministic analyzer only knows about the four RA 7160 levels
    // and would otherwise crash trying to look up penalty rules for an
    // arbitrary string.
    if (!isJurisdictionLevel(jurisdiction)) {
      // Skip the deterministic analyzer too — it requires a known jurisdiction
      // to compute penalty rule lookups. Return an empty compliance result
      // so callers can still proceed without throwing.
      return { overallScore: 0, isValid: false, issues: [] };
    }

    const deterministic = analyzeDeterministicCompliance(content, jurisdiction);

    const config = this.getConfig();
    const { AzureOpenAI } = await import('openai');

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      endpoint: config.endpoint,
    });

    try {
      const result = await client.chat.completions.create({
        model: config.deployment,
        max_completion_tokens: 2500,
        messages: [
          {
            role: 'system',
            content:
              'You are a Philippine legal drafting reviewer. Return only additional findings that are not obvious structural checks.',
          },
          {
            role: 'user',
            content: `Review this ${jurisdiction} ordinance. Return up to 3 additional findings in JSON: { "issues": [{ "type": "critical"|"warning"|"suggestion", "section": "...", "title": "...", "description": "...", "suggestion": "..." }] }\n\nDraft:\n${content}`,
          },
        ],
      });

      const text = result.choices[0]?.message?.content ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          issues?: ComplianceIssue[];
        };
        const aiIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
        const merged = mergeComplianceIssues(deterministic.issues, aiIssues);
        return buildComplianceResultFromIssues(merged);
      }
    } catch {
      // Fall back to deterministic only
    }

    return deterministic;
  }

  async generateSummary(content: string) {
    const config = this.getConfig();
    const { AzureOpenAI } = await import('openai');

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      endpoint: config.endpoint,
    });

    const completion = await client.chat.completions.create({
      model: config.deployment,
      max_completion_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'You write concise executive summaries for Philippine local government ordinance drafts.',
        },
        {
          role: 'user',
          content: `Generate a 2-3 paragraph executive summary for this Philippine ordinance:\n\n${content}`,
        },
      ],
    });

    return { summary: completion.choices[0]?.message?.content ?? '' };
  }

  async *generateOrdinanceStream(
    prompt: string,
    jurisdiction: string,
    jurisdictionName: string,
    documentType: string,
  ): AsyncGenerator<string, void, unknown> {
    const config = this.getConfig();
    const { AzureOpenAI } = await import('openai');

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      endpoint: config.endpoint,
    });

    const normalizedJurisdiction = isJurisdictionLevel(jurisdiction) ? jurisdiction : 'barangay';
    const citations = getStatutoryCitations(prompt, normalizedJurisdiction);
    const citationContext = citations
      .map((c) => `- ${c.source} ${c.provision} (${c.title}): ${c.relevance}`)
      .join('\n');

    const systemPrompt = `You are an expert Philippine legislative drafting assistant. Generate an official, legally sound ${documentType.toLowerCase()} for ${jurisdictionName} (${normalizedJurisdiction} level) conforming strictly to Republic Act No. 7160 (Local Government Code of 1991).

Statutory Grounding References:
${citationContext}

Document Requirements:
1. Republic Header ("REPUBLIC OF THE PHILIPPINES", Jurisdiction name, "OFFICE OF THE SANGGUNIAN")
2. Formal Document Title (e.g. "ORDINANCE NO. 2025-___")
3. Formal Preamble with WHEREAS clauses citing relevant statutory bases (RA 7160 § 16, Constitution, DILG guidelines)
4. Enacting Clause ("BE IT ORDAINED, by the Sanggunian in session assembled...")
5. Standard Sections: Title, Declaration of Policy, Definitions, Operative Provisions, Penal Provisions (strictly obeying ${jurisdiction} limits), Administrative Enforcement, Separability Clause, Repealing Clause, Effectivity Clause.`;

    const stream = await client.chat.completions.create({
      model: config.deployment,
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        yield delta;
      }
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
    const config = this.getConfig();
    const { AzureOpenAI } = await import('openai');

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      endpoint: config.endpoint,
    });

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

    const completion = await client.chat.completions.create({
      model: config.deployment,
      max_completion_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return {
      sectionBody: completion.choices[0]?.message?.content?.trim() ?? '',
      action,
      model: config.deployment,
    };
  }
}
