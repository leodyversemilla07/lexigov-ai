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

  const systemPrompt = `You are an expert Philippine legislative drafting assistant. Generate an official, legally sound ${params.documentType.toLowerCase()} for ${params.jurisdictionName} (${normalizedJurisdiction} level) conforming strictly to Republic Act No. 7160 (Local Government Code of 1991).

Statutory Grounding References:
${citationContext || '- Republic Act No. 7160 (Local Government Code of 1991)'}

Document Requirements:
1. Republic Header ("REPUBLIC OF THE PHILIPPINES", Jurisdiction name, "OFFICE OF THE SANGGUNIAN")
2. Formal Document Title (e.g. "ORDINANCE NO. 2025-___")
3. Formal Preamble with WHEREAS clauses citing relevant statutory bases (RA 7160 § 16 General Welfare Clause, 1987 Constitution, and applicable national laws)
4. Enacting Clause ("BE IT ORDAINED, by the Sanggunian in session assembled...")
5. Standard Sections:
   - SECTION 1. Title.
   - SECTION 2. Declaration of Policy / Legal Basis.
   - SECTION 3. Definition of Terms.
   - SECTION 4. Operative Provisions / Mandates.
   - SECTION 5. Penal & Administrative Provisions (strictly observing ${normalizedJurisdiction} statutory ceilings: Barangay max ₱1,000; Municipal max ₱2,500/6 mos; City/Province max ₱5,000/1 yr).
   - SECTION 6. Administrative Enforcement & Implementing Rules.
   - SECTION 7. Separability Clause.
   - SECTION 8. Repealing Clause.
   - SECTION 9. Effectivity Clause.`;

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
  const systemPrompt = `You are a Philippine legislative drafting attorney. Assist the user in drafting, revising, or refining an ordinance section for a ${jurisdiction} local government unit in accordance with RA 7160. Maintain formal legislative wording, clarity, precision, and statutory compliance. Return only the revised text without preamble or commentary.`;

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
  const systemPrompt = `You are an expert legislative analyst. Provide an executive summary of the given Philippine local ordinance or resolution. Highlight the policy intent, key mandates, regulated entities, penalties, and implementation mechanisms in 2-3 clear paragraphs.`;

  return {
    systemPrompt,
    userPrompt: documentContent,
  };
}

export function buildComplianceAnalysisPrompt(
  content: string,
  jurisdiction: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a Philippine municipal legal officer and statutory compliance auditor specializing in the Local Government Code of 1991 (RA 7160).
Analyze the provided draft ordinance against:
1. Constitutional limitations and ultra vires risks.
2. Statutory penalty ceilings for ${jurisdiction} level under RA 7160.
3. Due process, hearing, and publication requirements.
4. Mandatory standard clauses (Separability, Repealing, Effectivity).

You must respond in valid JSON with no markdown wrapping or extra text. The JSON must follow this exact structure:
{
  "overallScore": <integer between 0 and 100>,
  "isValid": <boolean>,
  "issues": [
    {
      "type": "critical" | "warning" | "suggestion",
      "section": "<section label or number>",
      "title": "<concise issue title>",
      "description": "<explanation of the compliance gap>",
      "suggestion": "<actionable recommended fix>"
    }
  ]
}

Rules:
- "type" must be one of: "critical" (mandatory statutory requirement violated or unenforceable), "warning" (recommended clause missing or risky), "suggestion" (optional improvement).
- "issues" must not exceed 8 entries.
- "overallScore" is 100 minus deductions (critical -25, warning -10, suggestion -4) across the reported issues.
- "isValid" is false when any reported issue is of type "critical".`;

  return {
    systemPrompt,
    userPrompt: content,
  };
}
