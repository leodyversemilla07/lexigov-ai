export {
  documentStatusSchema,
  documentStatusValues,
  type DocumentStatus,
  documentTypeSchema,
  documentTypeValues,
  type DocumentType,
  isDocumentStatus,
  isDocumentType,
  isJurisdictionLevel,
  jurisdictionLevelSchema,
  jurisdictionLevelValues,
  type JurisdictionLevel,
  toDocumentStatus,
  toDocumentType,
  toJurisdictionLevel,
} from '@lexigov/shared';

export const templateCategoryValues = [
  'Environment',
  'Health',
  'Public Safety',
  'Revenue',
  'Social Welfare',
  'Infrastructure',
  'Education',
  'Other',
] as const;
export type TemplateCategory = (typeof templateCategoryValues)[number];

