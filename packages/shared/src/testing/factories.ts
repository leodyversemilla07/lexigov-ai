import type {
  ComplianceResult,
  DraftSection,
  JurisdictionLevel,
  LegislativeMilestones,
  StructuredDraftContent,
} from '../index';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface MockOrganization {
  id: string;
  name: string;
  jurisdiction: JurisdictionLevel;
  region: string;
  province?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface MockDraft {
  id: string;
  title: string;
  documentType: string;
  jurisdiction: JurisdictionLevel;
  jurisdictionName: string;
  content: StructuredDraftContent;
  status: string;
  version: number;
  aiGenerated: boolean;
  userId: string;
  organizationId?: string | null;
  templateId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface MockTemplate {
  id: string;
  title: string;
  category: string;
  jurisdiction: JurisdictionLevel;
  documentType: string;
  description: string;
  content: StructuredDraftContent;
  visibility: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user_test_123',
    name: 'Atty. Maria Santos',
    email: 'maria.santos@pasig.gov.ph',
    role: 'SANGGUNIAN_SECRETARY',
    organizationId: 'org_pasig',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockOrganization(overrides: Partial<MockOrganization> = {}): MockOrganization {
  return {
    id: 'org_pasig',
    name: 'City Government of Pasig',
    jurisdiction: 'city',
    region: 'NCR',
    province: 'Metro Manila',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockMilestones(overrides: Partial<LegislativeMilestones> = {}): LegislativeMilestones {
  return {
    currentStage: 'FIRST_READING',
    firstReadingDate: '2026-08-01',
    referredCommittee: 'Committee on Laws, Rules & Internal Ethics',
    votingRecord: { ayes: 0, nays: 0, abstentions: 0 },
    lceAction: 'PENDING',
    ...overrides,
  };
}

export function createMockSection(index = 1, overrides: Partial<DraftSection> = {}): DraftSection {
  return {
    id: `sec-${index}`,
    heading: `SECTION ${index}. General Provisions.`,
    body: 'All individuals and entities within the territorial jurisdiction shall comply with the mandates herein set forth.',
    ...overrides,
  };
}

export function createMockDraft(overrides: Partial<MockDraft> = {}): MockDraft {
  const sections = [
    createMockSection(1, {
      heading: 'SECTION 1. Title.',
      body: 'This Ordinance shall be known as the Pasig City Waste Segregation Act of 2026.',
    }),
    createMockSection(2, {
      heading: 'SECTION 2. Declaration of Policy.',
      body: 'It is the policy of the City Government to ensure ecological sustainability pursuant to RA 7160 and RA 9003.',
    }),
    createMockSection(3, {
      heading: 'SECTION 3. Penalties.',
      body: 'Violators shall be subject to a fine of ₱5,000.00 or imprisonment not exceeding one (1) year pursuant to Section 458 of RA 7160.',
    }),
  ];

  return {
    id: 'draft_test_001',
    title: 'An Ordinance Regulating Waste Segregation and Resource Recovery in Pasig City',
    documentType: 'ORDINANCE',
    jurisdiction: 'city',
    jurisdictionName: 'City of Pasig',
    status: 'REVIEW',
    version: 1,
    aiGenerated: false,
    content: {
      body: sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n'),
      sections,
      milestones: createMockMilestones(),
      summary: 'An ordinance mandating waste segregation at source in Pasig City.',
    },
    userId: 'user_test_123',
    organizationId: 'org_pasig',
    templateId: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockComplianceResult(overrides: Partial<ComplianceResult> = {}): ComplianceResult {
  return {
    overallScore: 95,
    isValid: true,
    issues: [
      {
        type: 'suggestion',
        section: 'SECTION 3. Penalties.',
        title: 'Specify alternative community service',
        description:
          'Provide an alternative community service option for indigent violators under RA 7160 Section 458.',
        suggestion: 'Add: Provided, that indigent violators may render community service in lieu of fine payment.',
      },
    ],
    ...overrides,
  };
}

export function createMockTemplate(overrides: Partial<MockTemplate> = {}): MockTemplate {
  const sections = [
    createMockSection(1, { heading: 'SECTION 1. Title.', body: 'Standard Template Title.' }),
    createMockSection(2, { heading: 'SECTION 2. Scope.', body: 'Standard Template Scope.' }),
  ];

  return {
    id: 'tpl_test_001',
    title: 'Standard City Ordinance Template',
    category: 'ENVIRONMENT',
    jurisdiction: 'city',
    documentType: 'ORDINANCE',
    description: 'A baseline legislative template conforming to RA 7160 city standards.',
    content: {
      body: sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n'),
      sections,
    },
    visibility: 'PUBLIC',
    userId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
