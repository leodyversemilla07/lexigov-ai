/**
 * AI Generation Zod Schemas
 * Validation for the current Azure OpenAI-powered drafting flows
 */
import { z } from 'zod';
import { createDraftSchema } from './draft';
import { documentTypeSchema, jurisdictionLevelSchema } from './enums';

// Generate ordinance schema
export const generateOrdinanceSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(5000, 'Prompt is too long (max 5000 characters)'),
  jurisdiction: jurisdictionLevelSchema,
  jurisdictionName: z.string().min(1, 'Jurisdiction name is required'),
  documentType: documentTypeSchema,
  templateId: z.string().min(1).optional(),
});
export type GenerateOrdinanceInput = z.infer<typeof generateOrdinanceSchema>;

export const aiDraftFormSchema = generateOrdinanceSchema.omit({ templateId: true }).extend({
  title: createDraftSchema.shape.title,
  quickTemplateId: z.string().default('custom'),
});
export type AIDraftFormInput = z.infer<typeof aiDraftFormSchema>;

export const complianceIssueSchema = z
  .object({
    type: z.enum(['critical', 'warning', 'suggestion']),
    section: z.string().max(500).optional(),
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    suggestion: z.string().min(1).max(5000),
  })
  .strict();
export const aiComplianceResultSchema = z
  .object({
    issues: z.array(complianceIssueSchema).max(8),
  })
  .strict();

// Compliance check schema
export const complianceCheckSchema = z.object({
  content: z.string().min(1, 'Draft content is required'),
  jurisdiction: jurisdictionLevelSchema,
});
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;

// Executive summary generation schema
export const generateSummarySchema = z.object({
  content: z.string().min(1, 'Draft content is required'),
  maxLength: z.number().int().positive().max(2000).optional(),
});
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;

// Legal reference suggestion schema
export const suggestReferencesSchema = z.object({
  content: z.string().min(1, 'Draft content is required'),
  sectionNumber: z.number().int().positive().optional(),
});
export type SuggestReferencesInput = z.infer<typeof suggestReferencesSchema>;

// Full ordinance generation params (for AI service)
export const ordinanceGenerationParamsSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  ordinanceType: jurisdictionLevelSchema,
  jurisdiction: z.object({
    name: z.string().min(1),
    province: z.string().optional(),
    city: z.string().optional(),
  }),
  problemStatement: z.string().min(1, 'Problem statement is required'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  targetPopulation: z.string().min(1, 'Target population is required'),
  prohibitedActs: z.array(z.string()),
  enforcementBody: z.string().min(1, 'Enforcement body is required'),
  penalties: z
    .object({
      firstOffense: z.string().optional(),
      secondOffense: z.string().optional(),
      thirdOffense: z.string().optional(),
    })
    .optional(),
  exceptions: z.array(z.string()).optional(),
  budget: z.string().optional(),
});
export type OrdinanceGenerationParamsInput = z.infer<typeof ordinanceGenerationParamsSchema>;
