import { buildDraftSectionsFromBody, composeDraftBodyFromSections } from './draft-content';

type TemplateDocumentType = 'ORDINANCE' | 'RESOLUTION' | 'MEMORANDUM' | 'POLICY';
type TemplateJurisdiction = 'barangay' | 'municipal' | 'city' | 'provincial';

type TemplateRecord = Record<string, unknown>;
type TemplateSection = { id: string; heading: string; body: string };

export interface TemplateData {
  id: string;
  _id?: string;
  name: string;
  category: string;
  subcategory?: string;
  jurisdiction: string[];
  structure: unknown;
  exampleContent?: unknown;
  usageCount: number;
}

const documentTypes: TemplateDocumentType[] = ['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY'];
const jurisdictions: TemplateJurisdiction[] = ['barangay', 'municipal', 'city', 'provincial'];

function asRecord(value: unknown): TemplateRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as TemplateRecord;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) {
      return text;
    }
  }

  return null;
}

function getObjectValue(record: TemplateRecord | null, key: string) {
  return record?.[key];
}

function replaceTemplateVariables(text: string, jurisdictionName: string, penalty?: string) {
  return text
    .replaceAll('[JURISDICTION]', jurisdictionName || '[Jurisdiction Name]')
    .replaceAll('[PENALTY]', penalty || '[Penalty]');
}

function readTemplateSections(value: unknown): TemplateSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section) => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        return null;
      }

      const sectionRecord = section as TemplateRecord;
      const heading = asString(sectionRecord.heading);
      const body = asString(sectionRecord.body) || '';

      if (!heading && !body) {
        return null;
      }

      return {
        id: asString(sectionRecord.id) || `${(heading || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        heading: heading || 'Untitled Section',
        body,
      };
    })
    .filter((section): section is TemplateSection => Boolean(section));
}

export function getTemplateDescription(template: TemplateData) {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);

  return (
    firstString(
      template.subcategory,
      getObjectValue(exampleContent, 'description'),
      getObjectValue(exampleContent, 'summary'),
      getObjectValue(structure, 'description'),
      getObjectValue(structure, 'summary'),
    ) || 'Reusable ordinance template'
  );
}

export function getTemplateDocumentType(template: TemplateData): TemplateDocumentType {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);
  const candidate = firstString(
    getObjectValue(exampleContent, 'documentType'),
    getObjectValue(structure, 'documentType'),
  );

  return documentTypes.find((documentType) => documentType === candidate) || 'ORDINANCE';
}

export function getTemplateJurisdiction(template: TemplateData): TemplateJurisdiction | null {
  return (
    template.jurisdiction.find((value): value is TemplateJurisdiction =>
      jurisdictions.includes(value as TemplateJurisdiction),
    ) || null
  );
}

export function getTemplatePrompt(template: TemplateData, jurisdictionName: string, penalty?: string) {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);
  const rawPrompt = firstString(
    getObjectValue(exampleContent, 'prompt'),
    getObjectValue(exampleContent, 'instructions'),
    getObjectValue(structure, 'prompt'),
    getObjectValue(structure, 'instructions'),
  );

  const templateSections = getTemplateSections(template);
  const fallbackPrompt = [
    `Create a ${getTemplateDocumentType(template).toLowerCase()} for ${jurisdictionName || '[Jurisdiction Name]'} based on the ${template.name} template.`,
    `Category: ${template.category}.`,
    template.subcategory ? `Focus: ${template.subcategory}.` : null,
    'Include legal basis, operational provisions, penalties, separability, and effectivity clauses.',
    templateSections.length > 0
      ? `Use these template sections as the ordinance backbone: ${templateSections.map((section) => section.heading).join('; ')}.`
      : null,
    penalty ? `Penalty guidance: ${penalty}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return replaceTemplateVariables(rawPrompt || fallbackPrompt, jurisdictionName, penalty);
}

export function getTemplateBody(template: TemplateData, jurisdictionName: string, penalty?: string) {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);
  const templateSections = getTemplateSections(template);
  const rawBody = firstString(
    getObjectValue(exampleContent, 'body'),
    getObjectValue(exampleContent, 'content'),
    getObjectValue(exampleContent, 'text'),
    getObjectValue(structure, 'body'),
    getObjectValue(structure, 'content'),
    getObjectValue(structure, 'text'),
    getObjectValue(structure, 'template'),
  );
  const sectionBody = templateSections.length > 0 ? composeDraftBodyFromSections(templateSections) : null;

  const fallbackBody = [
    `${getTemplateDocumentType(template)}`,
    template.name,
    jurisdictionName ? jurisdictionName : '[Jurisdiction Name]',
    '',
    'SECTION 1. Title.',
    `This measure shall be known as the "${template.name}".`,
    '',
    'SECTION 2. Purpose.',
    `This template covers ${template.category.toLowerCase()} matters for the local government unit.`,
    '',
    'SECTION 3. Key Provisions.',
    '- Define scope, covered persons, and prohibited acts.',
    penalty
      ? `- Apply penalties consistent with ${penalty}.`
      : '- Apply penalties consistent with local authority limits.',
    '- Identify the enforcing office and implementation steps.',
    '',
    'SECTION 4. Separability Clause.',
    'If any part of this ordinance is held invalid, the remaining provisions shall remain in full force and effect.',
    '',
    'SECTION 5. Effectivity Clause.',
    'This ordinance shall take effect after compliance with publication and posting requirements.',
  ].join('\n');

  return replaceTemplateVariables(sectionBody || rawBody || fallbackBody, jurisdictionName, penalty);
}

export function getTemplateSections(template: TemplateData) {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);
  // exampleContent often mirrors structure; concatenating both duplicates every section.
  const exampleSections = readTemplateSections(getObjectValue(exampleContent, 'sections'));
  const structureSections = readTemplateSections(getObjectValue(structure, 'sections'));
  if (exampleSections.length > 0) return exampleSections;
  if (structureSections.length > 0) return structureSections;

  return buildDraftSectionsFromBody(getTemplateBodyFromRaw(template));
}

function getTemplateBodyFromRaw(template: TemplateData) {
  const structure = asRecord(template.structure);
  const exampleContent = asRecord(template.exampleContent);

  return (
    firstString(
      getObjectValue(exampleContent, 'body'),
      getObjectValue(exampleContent, 'content'),
      getObjectValue(exampleContent, 'text'),
      getObjectValue(structure, 'body'),
      getObjectValue(structure, 'content'),
      getObjectValue(structure, 'text'),
      getObjectValue(structure, 'template'),
    ) || ''
  );
}
