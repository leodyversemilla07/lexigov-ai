export const jurisdictionLevelValues = ['barangay', 'city', 'municipal', 'provincial'] as const;
export type JurisdictionLevel = (typeof jurisdictionLevelValues)[number];

export const documentTypeValues = ['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY'] as const;
export type DocumentType = (typeof documentTypeValues)[number];

export const documentStatusValues = ['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED'] as const;
export type DocumentStatus = (typeof documentStatusValues)[number];

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
