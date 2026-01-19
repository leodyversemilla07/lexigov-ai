/**
 * AI Generation Service
 * Handles ordinance generation using Google AI Studio (Gemini API)
 * 
 * Features:
 * - Philippine Ordinance Generation (RA 7160 compliant)
 * - Compliance Checking
 * - Executive Summary Generation
 * - Legal Reference Suggestions
 */

import type {
  PhilippineOrdinance,
  OrdinanceGenerationParams,
  OrdinanceGenerationResponse,
  ComplianceIssue,
  JurisdictionLevel
} from '@repo/types'
import { PENALTY_LIMITS } from '@repo/types'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: {
    pro: 'gemini-2.5-pro',
    flash: 'gemini-2.0-flash'
  },
  temperature: 0.7,
  maxOutputTokens: 8192,
  topP: 0.95,
  topK: 40
}

// ============================================================================
// Types
// ============================================================================

interface ComplianceCheckResult {
  overallScore: number
  isValid: boolean
  issuesCount: number
  warningsCount: number
  suggestionsCount: number
  issues: ComplianceIssue[]
  checkedAt: Date
}

// ============================================================================
// Gemini Client
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_CONFIG.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);
  }
  return genAI;
}

/**
 * Call Gemini API using Google Generative AI SDK
 */
async function callGeminiAPI(
  prompt: string,
  useProModel: boolean = false,
  expectJson: boolean = false
): Promise<{ text: string; tokens: { input: number; output: number; total: number } }> {
  // Check if we're in development mode without credentials
  const isDev = process.env.NODE_ENV === 'development'
  const hasKey = !!process.env.GEMINI_API_KEY

  // Return mock in development without credentials
  if (isDev && !hasKey) {
    console.warn('[Gemini AI] Running in development mode without API Key - using mock responses')
    return {
      text: generateMockOrdinance(prompt),
      tokens: { input: 100, output: 500, total: 600 }
    }
  }

  try {
    const client = getGeminiClient()
    const modelName = useProModel ? GEMINI_CONFIG.model.pro : GEMINI_CONFIG.model.flash

    const model = client.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        topP: GEMINI_CONFIG.topP,
        topK: GEMINI_CONFIG.topK,
        responseMimeType: expectJson ? 'application/json' : 'text/plain'
      }
    })

    const response = result.response
    const text = response.text()

    // Calculate estimated tokens (SDK doesn't always return usage metadata perfectly yet, so we try to get it safely)
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }

    return {
      text,
      tokens: {
        input: usage.promptTokenCount || 0,
        output: usage.candidatesTokenCount || 0,
        total: usage.totalTokenCount || 0
      }
    }
  } catch (error) {
    console.error('[Gemini AI] Error:', error)

    // Fallback to mock in case of error during development
    if (isDev) {
      console.warn('[Gemini AI] Falling back to mock response due to error')
      return {
        text: generateMockOrdinance(prompt),
        tokens: { input: 100, output: 500, total: 600 }
      }
    }

    throw error
  }
}

// ============================================================================
// Mock Generation (for development)
// ============================================================================

function generateMockOrdinance(prompt: string): string {
  return JSON.stringify({
    metadata: {
      documentNumber: "ORD-2026-001",
      title: "Mock Ordinance for Testing",
      documentType: "ORDINANCE",
      jurisdiction: {
        level: "barangay",
        name: "Test Barangay"
      },
      dateCreated: new Date().toISOString(),
      authors: ["System Generated"]
    },
    header: {
      republic: "Republic of the Philippines",
      province: "Test Province",
      cityMunicipality: "Test City",
      barangay: "Test Barangay",
      documentType: "BARANGAY ORDINANCE",
      ordinanceNumber: "ORD-2026-001"
    },
    preamble: {
      enactingClause: "BE IT ORDAINED by the Sangguniang Barangay of Test Barangay, in session assembled, that:",
      whereasClauses: [
        {
          number: 1,
          content: "This is a mock ordinance for testing purposes",
          legalBasis: "Section 16, RA 7160"
        }
      ]
    },
    body: {
      sections: [
        {
          number: 1,
          title: "Title",
          content: "This ordinance shall be known as the Mock Testing Ordinance."
        },
        {
          number: 2,
          title: "Declaration of Policy",
          content: "This is a mock policy for testing the system."
        }
      ]
    },
    finalProvisions: {
      separabilityClause: true,
      separabilityText: "If any provision of this ordinance is declared invalid, the remaining provisions shall remain in full force and effect.",
      repealingClause: true,
      effectivityClause: true,
      effectivityText: "This ordinance shall take effect ten (10) days after posting in accordance with law.",
      signatures: [
        {
          name: "Test Official",
          position: "Punong Barangay"
        }
      ]
    },
    compliance: {
      isValidStructure: true,
      hasRequiredSections: true,
      penaltyWithinLimits: true,
      hasEffectivityClause: true,
      hasSeparabilityClause: true,
      hasRepealingClause: true,
      dueProcessAdequate: true,
      score: 95
    }
  }, null, 2)
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Generate a Philippine ordinance using Gemini AI
 */
export async function generateOrdinance(
  params: OrdinanceGenerationParams,
  useProModel: boolean = false
): Promise<OrdinanceGenerationResponse> {
  const prompt = buildOrdinancePrompt(params)

  const { text, tokens } = await callGeminiAPI(prompt, useProModel, true)

  // Parse the JSON response
  let ordinance: PhilippineOrdinance
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch?.[1] ?? text

    ordinance = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`Failed to parse ordinance JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    ordinance,
    generatedAt: new Date(),
    model: useProModel ? GEMINI_CONFIG.model.pro : GEMINI_CONFIG.model.flash,
    tokens
  }
}

/**
 * Check ordinance compliance using Gemini AI
 */
export async function checkCompliance(
  ordinance: PhilippineOrdinance
): Promise<ComplianceCheckResult> {
  const prompt = buildCompliancePrompt(ordinance)

  const { text } = await callGeminiAPI(prompt, true, true) // Use Pro model for compliance

  // Parse the JSON response
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch?.[1] ?? text

    const result = JSON.parse(jsonText)
    return {
      ...result,
      checkedAt: new Date()
    }
  } catch (error) {
    throw new Error(`Failed to parse compliance result: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate executive summary for an ordinance
 */
export async function generateExecutiveSummary(
  ordinance: PhilippineOrdinance
): Promise<string> {
  const prompt = buildSummaryPrompt(ordinance)

  const { text } = await callGeminiAPI(prompt, false, false) // Use Flash for summaries

  return text.trim()
}

/**
 * Suggest legal references for content
 */
export async function suggestLegalReferences(
  content: string,
  jurisdiction: JurisdictionLevel
): Promise<string[]> {
  const prompt = `You are a legal expert on Philippine local government law (RA 7160 - Local Government Code of 1991).
  
  Given the following ordinance content for a ${jurisdiction.toUpperCase()} government:
  
  """
  ${content}
  """
  
  Suggest relevant legal references and citations from RA 7160 and other applicable Philippine laws that support this content.
  
  Return ONLY a JSON array of strings, with each string being a legal reference citation.
  
  Example format:
  ["Section 16, RA 7160 (General Welfare Clause)", "Section 458, RA 7160 (Powers of Sangguniang Panlungsod)"]`

  const { text } = await callGeminiAPI(prompt, false, true)

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*?\]/)
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text

    return JSON.parse(jsonText)
  } catch (error) {
    console.error('Failed to parse legal references:', error)
    return []
  }
}

// ============================================================================
// Prompt Builders
// ============================================================================

function buildOrdinancePrompt(params: OrdinanceGenerationParams): string {
  const jurisdictionLevel = params.ordinanceType
  const penaltyLimits = (PENALTY_LIMITS as any)[jurisdictionLevel]

  return `You are an expert Philippine legislative drafter specializing in local government ordinances under RA 7160 (Local Government Code of 1991).
  
  Generate a complete, legally compliant ${jurisdictionLevel.toUpperCase()} ordinance with the following specifications:
  
  **Jurisdiction**: ${params.jurisdiction.name}${params.jurisdiction.province ? `, ${params.jurisdiction.province}` : ''}${params.jurisdiction.city ? `, ${params.jurisdiction.city}` : ''}
  **Topic**: ${params.topic}
  **Problem Statement**: ${params.problemStatement}
  
  **Objectives**:
  ${params.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}
  
  **Target Population**: ${params.targetPopulation}
  
  **Prohibited Acts**:
  ${params.prohibitedActs.map((act, i) => `${i + 1}. ${act}`).join('\n')}
  
  **Enforcement Body**: ${params.enforcementBody}
  
  ${params.penalties ? `**Penalties**:
  - First Offense: ${params.penalties.firstOffense || 'To be determined'}
  - Second Offense: ${params.penalties.secondOffense || 'To be determined'}
  - Third Offense: ${params.penalties.thirdOffense || 'To be determined'}` : ''}
  
  ${params.exceptions ? `**Exceptions**:
  ${params.exceptions.map((exc, i) => `${i + 1}. ${exc}`).join('\n')}` : ''}
  
  ${params.budget ? `**Budget**: ${params.budget}` : ''}
  
  **CRITICAL COMPLIANCE REQUIREMENTS (RA 7160)**:
  1. Penalty Limits for ${jurisdictionLevel.toUpperCase()}:
     - Maximum Fine: ₱${penaltyLimits.fine ? penaltyLimits.fine.toLocaleString() : 'As determined by law'}
     - Maximum Imprisonment: ${penaltyLimits.imprisonmentMonths ? `${penaltyLimits.imprisonmentMonths} ${penaltyLimits.imprisonmentMonths === 1 ? 'month' : 'months'}` : 'As determined by law'}
     - Court Required: ${penaltyLimits.courtRequired || 'Yes'}
  
  2. Required Sections:
     - Preamble with WHEREAS clauses citing legal basis (RA 7160)
     - Declaration of Policy (Section 2)
     - Definition of Terms (Section 3)
     - Prohibited Acts (clearly enumerated)
     - Exceptions (if applicable)
     - Penalty Clause (within legal limits)
     - Enforcement Provisions
     - Separability Clause
     - Repealing Clause
     - Effectivity Clause (10 days after posting)
  
  3. Legal Writing Standards:
     - Use active voice
     - Clear, unambiguous language
     - Enumerate prohibited acts specifically
     - Include due process provisions
     - Specify appeal mechanisms
  
  4. Constitutional Requirements:
     - Due process compliance
     - Equal protection
     - No vague or overbroad provisions
  
  Generate a complete ordinance following the TypeScript interface "PhilippineOrdinance" structure.
  
  Return ONLY valid JSON that matches this structure. Do not include any explanatory text outside the JSON.
  
  The JSON must include:
  - metadata (with documentNumber, title, documentType, jurisdiction object { level, name }, dateCreated, authors)
  - header (Republic, province, city/municipality, barangay if applicable, documentType, ordinanceNumber)
  - preamble (enactingClause, whereasClauses with legal basis)
  - body (sections with proper numbering, titles, content, prohibitedActs, penalties, enforcement)
  - finalProvisions (separabilityClause, repealingClause, effectivityClause, signatures)
  - compliance (all boolean flags and score)
  
  Ensure all penalties are within the legal limits stated above.`
}

function buildCompliancePrompt(ordinance: PhilippineOrdinance): string {
  const jurisdictionLevel = ordinance.metadata.jurisdiction.level
  const penaltyLimits = (PENALTY_LIMITS as any)[jurisdictionLevel]

  return `You are a legal compliance expert specializing in Philippine local government ordinances under RA 7160.
  
  Analyze the following ordinance for compliance with RA 7160 and Philippine legal standards:
  
  \`\`\`json
  ${JSON.stringify(ordinance, null, 2)}
  \`\`\`
  
  **Jurisdiction Level**: ${jurisdictionLevel.toUpperCase()}
  **Penalty Limits**:
  - Maximum Fine: ₱${penaltyLimits.fine ? penaltyLimits.fine.toLocaleString() : 'As determined by law'}
  - Maximum Imprisonment: ${penaltyLimits.imprisonmentMonths ? `${penaltyLimits.imprisonmentMonths} ${penaltyLimits.imprisonmentMonths === 1 ? 'month' : 'months'}` : 'As determined by law'}
  
  Check for:
  1. **Structural Compliance**: All required sections present
  2. **Penalty Compliance**: Fines and imprisonment within legal limits
  3. **Legal Clauses**: Separability, Repealing, Effectivity clauses
  4. **Due Process**: Adequate enforcement and appeal mechanisms
  5. **Legal Writing**: Active voice, clarity, specificity
  6. **Constitutional Issues**: Vagueness, overbreadth, equal protection
  
  Return a JSON object with:
  {
    "overallScore": number (0-100),
    "isValid": boolean,
    "issuesCount": number,
    "warningsCount": number,
    "suggestionsCount": number,
    "issues": [
      {
        "type": "critical" | "warning" | "suggestion",
        "section": number (if applicable),
        "title": string,
        "description": string,
        "suggestion": string,
        "legalReference": string (if applicable)
      }
    ]
  }
  
  Be thorough and specific. Return ONLY the JSON object.`
}

function buildSummaryPrompt(ordinance: PhilippineOrdinance): string {
  return `You are an expert at creating executive summaries for Philippine government ordinances.
  
  Create a concise, professional executive summary (2-3 paragraphs) for the following ordinance:
  
  **Title**: ${ordinance.metadata.title}
  **Jurisdiction**: ${ordinance.metadata.jurisdiction.name}
  
  **Full Ordinance**:
  \`\`\`json
  ${JSON.stringify(ordinance, null, 2)}
  \`\`\`
  
  The executive summary should:
  1. State the purpose and objectives clearly
  2. Highlight key provisions and prohibited acts
  3. Mention enforcement mechanisms and penalties
  4. Note any important exceptions or special provisions
  5. Be written in clear, professional language suitable for government officials
  
  Return ONLY the executive summary text (no JSON, no formatting marks).`
}
