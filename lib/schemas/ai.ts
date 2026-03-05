/**
 * AI Generation Zod Schemas
 * Validation for AI-powered ordinance generation and compliance checking
 */
import { z } from 'zod'
import { documentTypeSchema, jurisdictionLevelSchema } from './enums.js'

// Generate ordinance schema
export const generateOrdinanceSchema = z.object({
    prompt: z
        .string()
        .min(1, 'Prompt is required')
        .min(10, 'Please provide more details (at least 10 characters)')
        .max(5000, 'Prompt is too long (max 5000 characters)'),
    jurisdiction: jurisdictionLevelSchema,
    documentType: documentTypeSchema,
    templateId: z.string().cuid().optional()
})
export type GenerateOrdinanceInput = z.infer<typeof generateOrdinanceSchema>

// Compliance check schema
export const complianceCheckSchema = z.object({
    draftId: z.string().min(1, 'Draft ID is required'),
    content: z.record(z.unknown()).optional()
})
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>

// Executive summary generation schema
export const generateSummarySchema = z.object({
    draftId: z.string().min(1, 'Draft ID is required'),
    maxLength: z.number().int().positive().max(2000).optional()
})
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>

// Legal reference suggestion schema
export const suggestReferencesSchema = z.object({
    draftId: z.string().min(1, 'Draft ID is required'),
    sectionNumber: z.number().int().positive().optional()
})
export type SuggestReferencesInput = z.infer<typeof suggestReferencesSchema>

// Full ordinance generation params (for AI service)
export const ordinanceGenerationParamsSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    ordinanceType: jurisdictionLevelSchema,
    jurisdiction: z.object({
        name: z.string().min(1),
        province: z.string().optional(),
        city: z.string().optional()
    }),
    problemStatement: z.string().min(1, 'Problem statement is required'),
    objectives: z.array(z.string()).min(1, 'At least one objective is required'),
    targetPopulation: z.string().min(1, 'Target population is required'),
    prohibitedActs: z.array(z.string()),
    enforcementBody: z.string().min(1, 'Enforcement body is required'),
    penalties: z.object({
        firstOffense: z.string().optional(),
        secondOffense: z.string().optional(),
        thirdOffense: z.string().optional()
    }).optional(),
    exceptions: z.array(z.string()).optional(),
    budget: z.string().optional()
})
export type OrdinanceGenerationParamsInput = z.infer<typeof ordinanceGenerationParamsSchema>
