/**
 * Template Zod Schemas
 * Validation for creating and updating ordinance templates
 */
import { z } from 'zod'
import { documentTypeSchema, jurisdictionLevelSchema } from './enums'

// Template categories
export const templateCategoryValues = [
    'Environment',
    'Health',
    'Public Safety',
    'Revenue',
    'Social Welfare',
    'Infrastructure',
    'Education',
    'Other'
 ] as const
export const templateCategorySchema = z.enum(templateCategoryValues)
export type TemplateCategory = z.infer<typeof templateCategorySchema>
export const templateVisibilitySchema = z.enum(['public', 'private'])
export type TemplateVisibility = z.infer<typeof templateVisibilitySchema>

const templateNameSchema = z
    .string()
    .min(1, 'Template name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must be less than 200 characters')

const templateTextFieldSchema = z
    .string()
    .max(5000, 'Field must be less than 5000 characters')

const templateBodyFieldSchema = z
    .string()
    .max(50000, 'Starter body must be less than 50000 characters')

// Create template schema
export const createTemplateSchema = z.object({
    name: templateNameSchema,
    category: templateCategorySchema,
    subcategory: z.string().optional(),
    jurisdiction: z.array(jurisdictionLevelSchema).min(1, 'At least one jurisdiction is required'),
    structure: z.record(z.unknown()),
    exampleContent: z.record(z.unknown()).optional(),
    isPublic: z.boolean().default(true)
})
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

export const templateEditorSchema = z.object({
    name: templateNameSchema,
    category: templateCategorySchema,
    subcategory: z
        .string()
        .max(200, 'Focus area must be less than 200 characters'),
    documentType: documentTypeSchema,
    jurisdictions: z
        .array(jurisdictionLevelSchema)
        .min(1, 'At least one jurisdiction is required'),
    description: templateTextFieldSchema,
    prompt: templateTextFieldSchema,
    body: templateBodyFieldSchema,
    visibility: templateVisibilitySchema,
})
export type TemplateEditorInput = z.infer<typeof templateEditorSchema>

// Update template schema
export const updateTemplateSchema = z.object({
    name: templateNameSchema.optional(),
    category: templateCategorySchema.optional(),
    subcategory: z.string().optional(),
    jurisdiction: z.array(jurisdictionLevelSchema).optional(),
    structure: z.record(z.unknown()).optional(),
    exampleContent: z.record(z.unknown()).optional(),
    isPublic: z.boolean().optional()
})
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

// Template query schema
export const templateQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    category: z.string().optional(),
    jurisdiction: jurisdictionLevelSchema.optional(),
    isPublic: z.coerce.boolean().optional(),
    search: z.string().optional()
})
export type TemplateQueryInput = z.infer<typeof templateQuerySchema>
