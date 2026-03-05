/**
 * Template Zod Schemas
 * Validation for creating and updating ordinance templates
 */
import { z } from 'zod'
import { jurisdictionLevelSchema } from './enums.js'

// Template categories
export const templateCategorySchema = z.enum([
    'Environment',
    'Health',
    'Public Safety',
    'Revenue',
    'Social Welfare',
    'Infrastructure',
    'Education',
    'Other'
])
export type TemplateCategory = z.infer<typeof templateCategorySchema>

// Create template schema
export const createTemplateSchema = z.object({
    name: z
        .string()
        .min(1, 'Template name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(200, 'Name must be less than 200 characters'),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().optional(),
    jurisdiction: z.array(jurisdictionLevelSchema).optional(),
    structure: z.record(z.unknown()),
    exampleContent: z.record(z.unknown()).optional(),
    isPublic: z.boolean().default(true)
})
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

// Update template schema
export const updateTemplateSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(200)
        .optional(),
    category: z.string().optional(),
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
