import { describe, expect, it } from 'vitest';
import {
  calculateTransmittalDeadline,
  getDefaultMilestones,
  LEGISLATIVE_STAGES,
  SANGGUNIAN_ROLE_LABELS,
  STAGE_TRANSITION_ROLES,
  validateStageTransition,
} from '../src/legislative-tracker';
import { createMockMilestones } from '../src/testing';

describe('Sanggunian Legislative Tracker & RBAC Suite', () => {
  describe('calculateTransmittalDeadline()', () => {
    it('computes 10-day statutory transmittal deadline for city ordinances under RA 7160 § 54', () => {
      const deadline = calculateTransmittalDeadline('2026-08-01', 'city');
      expect(deadline).toBe('2026-08-11');
    });

    it('computes 15-day statutory transmittal deadline for provincial ordinances under RA 7160 § 54', () => {
      const deadline = calculateTransmittalDeadline('2026-08-01', 'provincial');
      expect(deadline).toBe('2026-08-16');
    });

    it('returns empty string for invalid date input', () => {
      expect(calculateTransmittalDeadline('invalid-date', 'city')).toBe('');
    });
  });

  describe('getDefaultMilestones()', () => {
    it('returns default DRAFTING stage with initialized voting record and pending LCE action', () => {
      const milestones = getDefaultMilestones();
      expect(milestones.currentStage).toBe('DRAFTING');
      expect(milestones.votingRecord).toEqual({ ayes: 0, nays: 0, abstentions: 0 });
      expect(milestones.lceAction).toBe('PENDING');
    });
  });

  describe('validateStageTransition()', () => {
    it('allows LEGISLATIVE_STAFF to advance from DRAFTING to FIRST_READING', () => {
      const milestones = createMockMilestones({ currentStage: 'DRAFTING' });
      const result = validateStageTransition(milestones, 'FIRST_READING', 'LEGISLATIVE_STAFF', 'city');

      expect(result.isValid).toBe(true);
    });

    it('rejects transition to COMMITTEE_REVIEW when referredCommittee is missing', () => {
      const milestones = createMockMilestones({
        currentStage: 'FIRST_READING',
        referredCommittee: '',
      });
      const result = validateStageTransition(milestones, 'COMMITTEE_REVIEW', 'SANGGUNIAN_SECRETARY', 'city');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('referred Standing Committee');
    });

    it('allows SANGGUNIAN_SECRETARY to advance to COMMITTEE_REVIEW when referredCommittee is provided', () => {
      const milestones = createMockMilestones({
        currentStage: 'FIRST_READING',
        referredCommittee: 'Committee on Laws and Ordinances',
      });
      const result = validateStageTransition(milestones, 'COMMITTEE_REVIEW', 'SANGGUNIAN_SECRETARY', 'city');

      expect(result.isValid).toBe(true);
    });

    it('rejects LEGISLATIVE_STAFF from advancing to SECOND_READING', () => {
      const milestones = createMockMilestones({
        currentStage: 'COMMITTEE_REVIEW',
        committeeReportNo: 'CR-2026-001',
      });
      const result = validateStageTransition(milestones, 'SECOND_READING', 'LEGISLATIVE_STAFF', 'city');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Access Denied');
    });

    it('allows COMMITTEE_CHAIR to advance to SECOND_READING when committeeReportNo is provided', () => {
      const milestones = createMockMilestones({
        currentStage: 'COMMITTEE_REVIEW',
        committeeReportNo: 'CR-2026-001',
      });
      const result = validateStageTransition(milestones, 'SECOND_READING', 'COMMITTEE_CHAIR', 'city');

      expect(result.isValid).toBe(true);
    });

    it('rejects 3rd Reading enactment when voting record fails majority (Ayes <= Nays)', () => {
      const milestones = createMockMilestones({
        currentStage: 'THIRD_READING',
        votingRecord: { ayes: 5, nays: 7, abstentions: 1 },
      });
      const result = validateStageTransition(milestones, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('affirmative nominal roll-call majority');
    });

    it('allows PRESIDING_OFFICER to transmit when nominal vote passes (Ayes > Nays)', () => {
      const milestones = createMockMilestones({
        currentStage: 'THIRD_READING',
        votingRecord: { ayes: 12, nays: 1, abstentions: 0 },
      });
      const result = validateStageTransition(milestones, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city');

      expect(result.isValid).toBe(true);
    });

    it('allows LCE_OFFICE to approve and enact', () => {
      const milestones = createMockMilestones({
        currentStage: 'TRANSMITTED_TO_LCE',
        lceAction: 'APPROVED',
        lceActionDate: '2026-08-05',
      });
      const result = validateStageTransition(milestones, 'ENACTED', 'LCE_OFFICE', 'city');

      expect(result.isValid).toBe(true);
    });

    it('always allows LGU_ADMIN to execute transitions as workspace superuser', () => {
      const milestones = createMockMilestones({
        currentStage: 'COMMITTEE_REVIEW',
        committeeReportNo: 'CR-2026-042',
      });
      const result = validateStageTransition(milestones, 'SECOND_READING', 'LGU_ADMIN', 'city');

      expect(result.isValid).toBe(true);
    });
  });

  describe('Static Metadata', () => {
    it('defines 7 sequential legislative stages', () => {
      expect(LEGISLATIVE_STAGES.length).toBe(7);
      expect(LEGISLATIVE_STAGES[0]?.stage).toBe('DRAFTING');
      expect(LEGISLATIVE_STAGES[6]?.stage).toBe('ENACTED');
    });

    it('provides role labels for all Sanggunian roles', () => {
      expect(SANGGUNIAN_ROLE_LABELS.PRESIDING_OFFICER.statutoryTitle).toContain('RA 7160');
      expect(SANGGUNIAN_ROLE_LABELS.SANGGUNIAN_SECRETARY.statutoryTitle).toContain('RA 7160 § 469');
      expect(SANGGUNIAN_ROLE_LABELS.LCE_OFFICE.statutoryTitle).toContain('RA 7160 § 54');
    });
  });
});
