import {
  getStatutoryCitations,
  type JurisdictionLevel,
  isJurisdictionLevel,
} from '@lexigov/shared';

export interface OrdinancePromptParams {
  prompt: string;
  jurisdiction: string;
  jurisdictionName: string;
  documentType: string;
  /** Optional retrieved statutory context used to ground the generated draft. */
  statutoryContext?: string;
}

export function buildOrdinanceDraftingPrompt(params: OrdinancePromptParams): {
  systemPrompt: string;
  userPrompt: string;
} {
  const normalizedJurisdiction: JurisdictionLevel = isJurisdictionLevel(params.jurisdiction)
    ? params.jurisdiction
    : 'barangay';

  const citations = getStatutoryCitations(params.prompt, normalizedJurisdiction);
  const citationContext = citations
    .map((c) => `- ${c.source} ${c.provision} (${c.title}): ${c.relevance}`)
    .join('\n');

  const systemPrompt = `You are an advisory Philippine legislative drafting assistant, not a lawyer, approving authority, or source of official records. Prepare a proposed working draft ${params.documentType.toLowerCase()} for ${params.jurisdictionName} (${normalizedJurisdiction} level). Do not claim that the measure is legally valid, compliant, approved, enacted, published, certified, signed, or supported by events the user did not provide. Mark uncertain legal or factual details with bracketed review notes.

Begin the output with "WORKING DRAFT — NOT AN OFFICIAL OR LEGALLY CERTIFIED RECORD". Use the references below only as review starting points whose current applicability must be confirmed against primary sources by authorized counsel.

Advisory Statutory References:
${citationContext || '- Republic Act No. 7160 (Local Government Code of 1991)'}

Proposed Document Structure:
1. Government-style header, clearly subordinate to the working-draft warning
2. Proposed document title with an unassigned number placeholder
3. Preamble citing only relevant legal bases and user-supplied facts; never invent completed hearings or consultations
4. Proposed enacting clause
5. Draft sections where applicable:
   - SECTION 1. Title.
   - SECTION 2. Declaration of Policy / Legal Basis.
   - SECTION 3. Definition of Terms.
   - SECTION 4. Operative Provisions / Mandates.
   - SECTION 5. Penal & Administrative Provisions (do not exceed the generally applicable ${normalizedJurisdiction} ceiling absent a separately verified legal basis: Barangay ₱1,000/no imprisonment; Municipal ₱2,500/6 months; City/Province ₱5,000/1 year).
   - SECTION 6. Administrative Enforcement & Implementing Rules.
   - SECTION 7. Separability Clause.
   - SECTION 8. Repealing Clause.
   - SECTION 9. Effectivity Clause.

End with a bracketed note requiring authorized factual and legal review before filing, deliberation, enactment, publication, or reliance.`;

  const userPrompt = params.statutoryContext
    ? `Statutory Context:\n${params.statutoryContext}\n\nUser Request:\n${params.prompt}`
    : params.prompt;

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildSectionAssistPrompt(
  currentText: string,
  instruction: string,
  jurisdiction: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an advisory Philippine legislative drafting assistant, not an attorney or approving authority. Assist with a proposed ordinance section for a ${jurisdiction} local government unit. Preserve formal wording while avoiding claims of legal compliance, approval, enactment, publication, or verified facts. Use bracketed review notes for uncertain legal or factual details. Return only the proposed revised text without preamble or commentary.`;

  const userPrompt = `Current Section Content:
"""
${currentText}
"""

Instruction:
${instruction}`;

  return { systemPrompt, userPrompt };
}

export function buildSummaryPrompt(documentContent: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are an advisory legislative drafting assistant. Summarize the supplied working draft without asserting that it is valid, compliant, approved, enacted, or authentic. Highlight its stated policy intent, mandates, regulated entities, penalties, and implementation mechanisms in 2-3 clear paragraphs.`;

  return {
    systemPrompt,
    userPrompt: documentContent,
  };
}

export function buildComplianceAnalysisPrompt(
  content: string,
  jurisdiction: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an advisory drafting-review assistant, not a municipal legal officer or compliance certifier. Identify potential review issues in the supplied Philippine local-government working draft. Do not state or imply that the result establishes legal validity or compliance.
Analyze the provided draft ordinance against:
1. Constitutional limitations and ultra vires risks.
2. Statutory penalty ceilings for ${jurisdiction} level under RA 7160.
3. Due process, hearing, and publication requirements.
4. Mandatory standard clauses (Separability, Repealing, Effectivity).

You must respond in valid JSON with no markdown wrapping or extra text. The JSON must follow this exact structure:
{
  "issues": [
    {
      "type": "critical" | "warning" | "suggestion",
      "section": "<section title or number>",
      "title": "<short issue title>",
      "description": "<concise explanation including the exact legal basis when known>",
      "suggestion": "<actionable fix>"
    }
  ]
}

Rules:
- "type" must be one of: "critical" (mandatory statutory requirement violated or unenforceable), "warning" (recommended clause missing or risky), "suggestion" (optional improvement).
- "issues" must not exceed 8 entries.
- Return only the "issues" array; the review score and validity flag are computed by the application, not by you.`;

  return {
    systemPrompt,
    userPrompt: content,
  };
}
