export {
  type DocumentStatus,
  type DocumentType,
  documentStatusSchema,
  documentStatusValues,
  documentTypeSchema,
  documentTypeValues,
  isDocumentStatus,
  isDocumentType,
  isJurisdictionLevel,
  type JurisdictionLevel,
  jurisdictionLevelSchema,
  jurisdictionLevelValues,
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
