import { describe, expect, it } from 'vitest';
import {
  createMockComplianceResult,
  createMockDraft,
  createMockMilestones,
  createMockOrganization,
  createMockSection,
  createMockTemplate,
  createMockUser,
} from '../src/testing';

describe('@lexigov/shared Test Data Factories', () => {
  describe('createMockUser()', () => {
    it('creates a user with realistic Philippine LGU defaults', () => {
      const user = createMockUser();
      expect(user.id).toBe('user_test_123');
      expect(user.role).toBe('SANGGUNIAN_SECRETARY');
      expect(user.email).toContain('@pasig.gov.ph');
    });

    it('allows partial overrides of user fields', () => {
      const user = createMockUser({
        name: 'Hon. Juan Dela Cruz',
        role: 'PRESIDING_OFFICER',
      });
      expect(user.name).toBe('Hon. Juan Dela Cruz');
      expect(user.role).toBe('PRESIDING_OFFICER');
      expect(user.id).toBe('user_test_123'); // Preserved default
    });
  });

  describe('createMockOrganization()', () => {
    it('creates an LGU organization default', () => {
      const org = createMockOrganization();
      expect(org.id).toBe('org_pasig');
      expect(org.jurisdiction).toBe('city');
      expect(org.name).toBe('City Government of Pasig');
    });
  });

  describe('createMockMilestones()', () => {
    it('creates RA 7160 legislative milestones', () => {
      const milestones = createMockMilestones();
      expect(milestones.currentStage).toBe('FIRST_READING');
      expect(milestones.referredCommittee).toBe('Committee on Laws, Rules & Internal Ethics');
      expect(milestones.lceAction).toBe('PENDING');
    });
  });

  describe('createMockSection()', () => {
    it('creates numbered draft sections', () => {
      const section = createMockSection(2);
      expect(section.id).toBe('sec-2');
      expect(section.heading).toContain('SECTION 2');
    });
  });

  describe('createMockDraft()', () => {
    it('creates a complete structured draft with sections and milestones', () => {
      const draft = createMockDraft();
      expect(draft.id).toBe('draft_test_001');
      expect(draft.status).toBe('FIRST_READING');
      expect(draft.content.sections.length).toBe(3);
      expect(draft.content.milestones?.currentStage).toBe('FIRST_READING');
      expect(draft.documentHash).toBeDefined();
    });

    it('allows overriding status and version for OCC testing', () => {
      const draft = createMockDraft({ status: 'ENACTED_PUBLISHED', version: 5 });
      expect(draft.status).toBe('ENACTED_PUBLISHED');
      expect(draft.version).toBe(5);
    });
  });

  describe('createMockComplianceResult()', () => {
    it('creates a compliance audit report fixture', () => {
      const result = createMockComplianceResult();
      expect(result.overallScore).toBe(95);
      expect(result.isValid).toBe(true);
      expect(result.issues[0]?.description).toContain('RA 7160');
    });
  });

  describe('createMockTemplate()', () => {
    it('creates a legislative template fixture', () => {
      const template = createMockTemplate();
      expect(template.id).toBe('tpl_test_001');
      expect(template.documentType).toBe('ORDINANCE');
      expect(template.visibility).toBe('PUBLIC');
    });
  });
});
