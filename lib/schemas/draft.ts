/**
 * Draft Zod Schemas
 * Validation for creating and updating ordinance drafts
 */
import { z } from 'zod'
import { documentTypeSchema, documentStatusSchema, jurisdictionLevelSchema } from './enums.js'

// Jurisdiction details schema
export const jurisdictionDetailsSchema = z.object({
    level: jurisdictionLevelSchema,
    name: z.string().min(1, 'Jurisdiction name is required'),
    province: z.string().optional(),
    city: z.string().optional()
})
export type JurisdictionDetailsInput = z.infer<typeof jurisdictionDetailsSchema>

// Create draft schema
export const createDraftSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .min(5, 'Title must be at least 5 characters')
        .max(500, 'Title must be less than 500 characters'),
    documentType: documentTypeSchema,
    jurisdiction: jurisdictionLevelSchema,
    jurisdictionName: z.string().min(1, 'Jurisdiction name is required'),
    content: z.record(z.unknown()).optional(),
    templateId: z.string().cuid().optional(),
    commitMessage: z.string().max(500).optional()
})
export type CreateDraftInput = z.infer<typeof createDraftSchema>

// Update draft schema
export const updateDraftSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(500, 'Title must be less than 500 characters')
        .optional(),
    content: z.record(z.unknown()).optional(),
    status: documentStatusSchema.optional(),
    commitMessage: z.string().max(500).optional(),
    aiGenerated: z.boolean().optional()
})
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>

// Draft filter/query schema
export const draftQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: documentStatusSchema.optional(),
    documentType: documentTypeSchema.optional(),
    search: z.string().optional()
})
export type DraftQueryInput = z.infer<typeof draftQuerySchema>
