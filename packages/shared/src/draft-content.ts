import type { LegislativeMilestones } from './legislative-tracker';

export type DraftSection = {
  id: string;
  heading: string;
  body: string;
  [key: string]: unknown;
};

export type StructuredDraftContent = {
  body: string;
  sections: DraftSection[];
  summary?: string;
  prompt?: string;
  generatedAt?: number;
  model?: string;
  milestones?: LegislativeMilestones;
  [key: string]: unknown;
};

type DraftContentRecord = Record<string, unknown>;

function asRecord(value: unknown): DraftContentRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as DraftContentRecord;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

function parseStoredSections(value: unknown): DraftSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section, index) => {
      const record = asRecord(section);
      if (!record) {
        return null;
      }

      const heading = asString(record.heading).trim();
      const body = asString(record.body).trim();
      if (!heading && !body) {
        return null;
      }

      return {
        id: asString(record.id).trim() || `${slugify(heading || `section-${index + 1}`)}-${index + 1}`,
        heading: heading || `Section ${index + 1}`,
        body,
      };
    })
    .filter((section): section is DraftSection => Boolean(section));
}

function buildSectionHeading(rawHeading: string, index: number) {
  const heading = rawHeading.trim();
  if (heading) {
    return heading;
  }

  return `Section ${index + 1}`;
}

export function buildDraftSectionsFromBody(body: string): DraftSection[] {
  const normalizedBody = body.trim();
  if (!normalizedBody) {
    return [];
  }

  const sectionRegex = /(SECTION\s+\d+[\s.:)-]*[^\n]*)([\s\S]*?)(?=\nSECTION\s+\d+[\s.:)-]*|\s*$)/gi;
  const matches = Array.from(normalizedBody.matchAll(sectionRegex));

  if (matches.length > 0) {
    return matches.map((match, index) => {
      const rawHeading = match[1] ?? '';
      const rawBody = match[2] ?? '';
      const heading = buildSectionHeading(rawHeading, index);
      const sectionBody = rawBody.trim();

      return {
        id: `${slugify(heading)}-${index + 1}`,
        heading,
        body: sectionBody,
      };
    });
  }

  const paragraphs = normalizedBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => {
    const [firstLine = '', ...rest] = paragraph.split('\n');
    const looksLikeHeading =
      /^#{1,6}\s+/.test(firstLine) ||
      /^[A-Z][A-Z\s]{4,}$/.test(firstLine.trim()) ||
      /^ARTICLE\s+[IVXLC0-9]+/i.test(firstLine.trim());

    const heading = looksLikeHeading ? firstLine.replace(/^#{1,6}\s+/, '').trim() : `Section ${index + 1}`;
    const bodyText = looksLikeHeading ? rest.join('\n').trim() : paragraph;

    return {
      id: `${slugify(heading)}-${index + 1}`,
      heading,
      body: bodyText,
    };
  });
}

export function composeDraftBodyFromSections(sections: DraftSection[]) {
  return sections
    .map((section) => {
      const heading = section.heading.trim();
      const body = section.body.trim();

      if (!heading && !body) {
        return '';
      }

      return [heading, body].filter(Boolean).join('\n');
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function createDraftSection(index: number): DraftSection {
  const heading = `SECTION ${index + 1}. New Section.`;

  return {
    id: `${slugify(heading)}-${index + 1}`,
    heading,
    body: '',
  };
}

export function extractDraftBody(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  const record = asRecord(content);
  if (!record) {
    return '';
  }

  return asString(record.body);
}

export function extractDraftSections(content: unknown) {
  const record = asRecord(content);
  const storedSections = parseStoredSections(record?.sections);
  if (storedSections.length > 0) {
    return storedSections;
  }

  return buildDraftSectionsFromBody(extractDraftBody(content));
}

export function buildDraftSummary(body: string) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^SECTION\s+\d+/i.test(line));

  return lines[0] || '';
}

export function extractDraftMilestones(content: unknown): LegislativeMilestones | undefined {
  const record = asRecord(content);
  if (!record?.milestones || typeof record.milestones !== 'object') {
    return undefined;
  }
  return record.milestones as LegislativeMilestones;
}

export function normalizeDraftContent(content: unknown): StructuredDraftContent {
  const record = asRecord(content);
  const body = extractDraftBody(content).trim();
  const sections = extractDraftSections(content);
  const summary = asString(record?.summary).trim() || buildDraftSummary(body) || undefined;
  const milestones = extractDraftMilestones(content);

  return {
    body,
    sections,
    summary,
    prompt: asString(record?.prompt).trim() || undefined,
    generatedAt: typeof record?.generatedAt === 'number' ? record.generatedAt : undefined,
    model: asString(record?.model).trim() || undefined,
    milestones,
  };
}

export function updateDraftBodyContent(content: unknown, body: string): StructuredDraftContent {
  const normalized = normalizeDraftContent(content);
  const trimmedBody = body.trim();

  return {
    ...normalized,
    body: trimmedBody,
    sections: buildDraftSectionsFromBody(trimmedBody),
    summary: buildDraftSummary(trimmedBody) || normalized.summary,
  };
}

export function updateDraftSectionsContent(content: unknown, sections: DraftSection[]): StructuredDraftContent {
  const normalized = normalizeDraftContent(content);
  const cleanedSections = sections
    .map((section, index) => ({
      id: section.id || `${slugify(section.heading || `section-${index + 1}`)}-${index + 1}`,
      heading: section.heading.trim() || `Section ${index + 1}`,
      body: section.body.trim(),
    }))
    .filter((section) => section.heading || section.body);
  const body = composeDraftBodyFromSections(cleanedSections);

  return {
    ...normalized,
    body,
    sections: cleanedSections,
    summary: buildDraftSummary(body) || normalized.summary,
  };
}

export function updateDraftMilestonesContent(
  content: unknown,
  milestones: LegislativeMilestones,
): StructuredDraftContent {
  const normalized = normalizeDraftContent(content);
  return {
    ...normalized,
    milestones,
  };
}
