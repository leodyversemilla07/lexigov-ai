import { describe, expect, it } from 'vitest';
import {
  calculateTransmittalDeadline,
  getDefaultMilestones,
  getLegislativeStages,
  LEGISLATIVE_STAGES,
  SANGGUNIAN_ROLE_LABELS,
  validateStageTransition,
  type VotingRecord,
} from '../src/legislative-tracker';
import { legislativeMilestonesSchema } from '../src/schemas/legislative';
import { createMockMilestones } from '../src/testing';

const passingVote: VotingRecord = {
  totalMembership: 12,
  membersPresent: 10,
  ayes: 6,
  nays: 3,
  abstentions: 1,
  rollCallRecorded: true,
};

describe('Sanggunian legislative milestone controls', () => {
  describe('deadline aid and stage paths', () => {
    it('computes the Section 54 calendar-date aid for city and provincial ordinances', () => {
      expect(calculateTransmittalDeadline('2026-08-01', 'city')).toBe('2026-08-11');
      expect(calculateTransmittalDeadline('2026-08-01', 'provincial')).toBe('2026-08-16');
    });

    it('does not invent a Section 54(b) deadline for barangay ordinances', () => {
      expect(calculateTransmittalDeadline('2026-08-01', 'barangay')).toBe('');
    });

    it('uses jurisdiction- and measure-specific post-vote stages', () => {
      const cityOrdinance = getLegislativeStages('city', 'ORDINANCE').map((item) => item.stage);
      const barangayOrdinance = getLegislativeStages('barangay', 'ORDINANCE').map((item) => item.stage);
      const resolution = getLegislativeStages('city', 'RESOLUTION').map((item) => item.stage);

      expect(cityOrdinance).toContain('TRANSMITTED_TO_LCE');
      expect(cityOrdinance).toContain('VETOED');
      expect(barangayOrdinance).toContain('AWAITING_PUNONG_BARANGAY_SIGNATURE');
      expect(barangayOrdinance).not.toContain('TRANSMITTED_TO_LCE');
      expect(resolution).toContain('ADOPTED');
      expect(resolution).not.toContain('TRANSMITTED_TO_LCE');
    });
  });

  describe('milestone schema', () => {
    it('initializes vote-evidence fields without asserting quorum or passage', () => {
      expect(getDefaultMilestones()).toMatchObject({
        currentStage: 'DRAFTING',
        votingRecord: {
          totalMembership: 0,
          membersPresent: 0,
          ayes: 0,
          nays: 0,
          abstentions: 0,
          rollCallRecorded: false,
        },
        lceAction: 'PENDING',
      });
    });

    it('rejects impossible calendar dates and unknown milestone evidence', () => {
      expect(
        legislativeMilestonesSchema.safeParse({ currentStage: 'DRAFTING', firstReadingDate: '2026-02-31' }).success,
      ).toBe(false);
      expect(
        legislativeMilestonesSchema.safeParse({ currentStage: 'DRAFTING', certifiedByLexigov: true }).success,
      ).toBe(false);
    });
  });

  describe('stage transition validation', () => {
    it('requires the secretary role and a recorded date for first reading', () => {
      const current = createMockMilestones({ currentStage: 'DRAFTING', firstReadingDate: undefined });
      const undated = { ...current, currentStage: 'FIRST_READING' as const };
      expect(validateStageTransition(current, 'FIRST_READING', 'SANGGUNIAN_SECRETARY', 'city', undated).isValid).toBe(
        false,
      );

      const dated = { ...undated, firstReadingDate: '2026-08-01' };
      expect(validateStageTransition(current, 'FIRST_READING', 'LEGISLATIVE_STAFF', 'city', dated).isValid).toBe(false);
      expect(validateStageTransition(current, 'FIRST_READING', 'SANGGUNIAN_SECRETARY', 'city', dated).isValid).toBe(
        true,
      );
    });

    it('rejects skipped or chronologically inconsistent stages', () => {
      const drafting = createMockMilestones({ currentStage: 'DRAFTING' });
      expect(validateStageTransition(drafting, 'THIRD_READING', 'LGU_ADMIN', 'city').error).toContain('cannot be skipped');

      const committee = createMockMilestones({
        currentStage: 'COMMITTEE_REVIEW',
        firstReadingDate: '2026-08-10',
        committeeHearingDate: '2026-08-09',
        committeeReportNo: 'CR-1',
        secondReadingDate: '2026-08-11',
      });
      const proposed = { ...committee, currentStage: 'SECOND_READING' as const };
      expect(validateStageTransition(committee, 'SECOND_READING', 'COMMITTEE_CHAIR', 'city', proposed).error).toContain(
        'cannot precede',
      );
    });

    it('requires committee and reading evidence as the measure advances', () => {
      const first = createMockMilestones({ currentStage: 'FIRST_READING', referredCommittee: '' });
      const committee = { ...first, currentStage: 'COMMITTEE_REVIEW' as const };
      expect(
        validateStageTransition(first, 'COMMITTEE_REVIEW', 'SANGGUNIAN_SECRETARY', 'city', committee).error,
      ).toContain('committee referral');

      const committeeReview = createMockMilestones({
        currentStage: 'COMMITTEE_REVIEW',
        committeeReportNo: 'CR-2026-001',
        secondReadingDate: '',
      });
      const second = { ...committeeReview, currentStage: 'SECOND_READING' as const };
      expect(validateStageTransition(committeeReview, 'SECOND_READING', 'COMMITTEE_CHAIR', 'city', second).error).toContain(
        'second-reading date',
      );
    });

    it('rejects vote totals without membership, quorum, roll-call support, or a sufficient majority', () => {
      const third = createMockMilestones({ currentStage: 'THIRD_READING', thirdReadingDate: '2026-08-03' });
      const proposed = {
        ...third,
        currentStage: 'TRANSMITTED_TO_LCE' as const,
        transmittedDate: '2026-08-04',
        transmittalDeadline: '2026-08-14',
        votingRecord: { ayes: 5, nays: 0, abstentions: 0 },
      };
      expect(validateStageTransition(third, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city', proposed).error).toContain(
        'membership',
      );

      proposed.votingRecord = { ...passingVote, membersPresent: 5 };
      expect(validateStageTransition(third, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city', proposed).error).toContain(
        'quorum',
      );

      proposed.votingRecord = { ...passingVote, rollCallRecorded: false };
      expect(validateStageTransition(third, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city', proposed).error).toContain(
        'roll-call',
      );
    });

    it('allows a city ordinance transmittal only with complete vote and date evidence', () => {
      const third = createMockMilestones({ currentStage: 'THIRD_READING', thirdReadingDate: '2026-08-03' });
      const proposed = {
        ...third,
        currentStage: 'TRANSMITTED_TO_LCE' as const,
        votingRecord: passingVote,
        transmittedDate: '2026-08-04',
        transmittalDeadline: '2026-08-14',
      };
      expect(
        validateStageTransition(third, 'TRANSMITTED_TO_LCE', 'PRESIDING_OFFICER', 'city', proposed, 'ORDINANCE'),
      ).toEqual({ isValid: true });
    });

    it('requires majority-of-all-members evidence before the barangay signature stage', () => {
      const third = createMockMilestones({ currentStage: 'THIRD_READING', thirdReadingDate: '2026-08-03' });
      const insufficient = {
        ...third,
        currentStage: 'AWAITING_PUNONG_BARANGAY_SIGNATURE' as const,
        votingRecord: { ...passingVote, totalMembership: 12, membersPresent: 10, ayes: 6, nays: 3 },
      };
      expect(
        validateStageTransition(
          third,
          'AWAITING_PUNONG_BARANGAY_SIGNATURE',
          'PRESIDING_OFFICER',
          'barangay',
          insufficient,
        ).error,
      ).toContain('majority of all');

      const sufficient = { ...insufficient, votingRecord: { ...insufficient.votingRecord, ayes: 7, nays: 2 } };
      expect(
        validateStageTransition(
          third,
          'AWAITING_PUNONG_BARANGAY_SIGNATURE',
          'PRESIDING_OFFICER',
          'barangay',
          sufficient,
        ).isValid,
      ).toBe(true);
    });

    it('uses the ordinary recorded majority for a barangay resolution rather than the ordinance signature rule', () => {
      const third = createMockMilestones({ currentStage: 'THIRD_READING', thirdReadingDate: '2026-08-03' });
      const proposed = {
        ...third,
        currentStage: 'ADOPTED' as const,
        votingRecord: { ...passingVote, totalMembership: 12, membersPresent: 10, ayes: 6, nays: 3 },
      };
      expect(
        validateStageTransition(third, 'ADOPTED', 'PRESIDING_OFFICER', 'barangay', proposed, 'RESOLUTION').isValid,
      ).toBe(true);
    });

    it('rejects same-stage executive action and requires atomic dated approval or veto', () => {
      const current = createMockMilestones({
        currentStage: 'TRANSMITTED_TO_LCE',
        thirdReadingDate: '2026-08-03',
        transmittedDate: '2026-08-04',
        transmittalDeadline: '2026-08-14',
        votingRecord: passingVote,
        lceAction: 'PENDING',
      });
      const sameStage = { ...current, lceAction: 'APPROVED' as const, lceActionDate: '2026-08-05' };
      expect(validateStageTransition(current, 'TRANSMITTED_TO_LCE', 'LCE_OFFICE', 'city', sameStage).error).toContain(
        'matching ENACTED or VETOED',
      );

      const approved = {
        ...sameStage,
        currentStage: 'ENACTED' as const,
        enactmentBasis: 'LCE_APPROVAL' as const,
      };
      expect(validateStageTransition(current, 'ENACTED', 'LCE_OFFICE', 'city', approved).isValid).toBe(true);

      const vetoed = {
        ...current,
        currentStage: 'VETOED' as const,
        lceAction: 'VETOED' as const,
        lceActionDate: '2026-08-05',
        vetoMessageReference: 'VETO-2026-01',
      };
      expect(validateStageTransition(current, 'VETOED', 'LCE_OFFICE', 'city', vetoed).isValid).toBe(true);
    });

    it('requires two-thirds of all members and separate evidence for a veto override', () => {
      const vetoed = createMockMilestones({
        currentStage: 'VETOED',
        thirdReadingDate: '2026-08-03',
        transmittedDate: '2026-08-04',
        lceAction: 'VETOED',
        lceActionDate: '2026-08-05',
        vetoMessageReference: 'VETO-2026-01',
      });
      const proposed = {
        ...vetoed,
        currentStage: 'ENACTED' as const,
        vetoOverrideDate: '2026-08-10',
        enactmentBasis: 'VETO_OVERRIDE' as const,
        vetoOverrideVotingRecord: { ...passingVote, ayes: 7, nays: 2 },
      };
      expect(validateStageTransition(vetoed, 'ENACTED', 'SANGGUNIAN_SECRETARY', 'city', proposed).error).toContain(
        'two-thirds',
      );
      proposed.vetoOverrideVotingRecord = { ...proposed.vetoOverrideVotingRecord, ayes: 8, nays: 1 };
      expect(validateStageTransition(vetoed, 'ENACTED', 'SANGGUNIAN_SECRETARY', 'city', proposed).isValid).toBe(true);
    });

    it('keeps deemed approval unavailable to ordinary draft editing', () => {
      const current = createMockMilestones({ currentStage: 'TRANSMITTED_TO_LCE' });
      const proposed = {
        ...current,
        currentStage: 'LAPSED_INTO_LAW' as const,
        enactmentBasis: 'DEEMED_APPROVED' as const,
      };
      expect(validateStageTransition(current, 'LAPSED_INTO_LAW', 'LGU_ADMIN', 'city', proposed).isValid).toBe(false);
    });
  });

  describe('advisory metadata', () => {
    it('includes visible veto and barangay outcomes without claiming certification', () => {
      expect(LEGISLATIVE_STAGES.some((item) => item.stage === 'VETOED')).toBe(true);
      expect(LEGISLATIVE_STAGES.some((item) => item.stage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE')).toBe(true);
      expect(LEGISLATIVE_STAGES.find((item) => item.stage === 'ENACTED')?.description).toContain('not independently verified');
    });

    it('describes roles as workspace roles rather than proof of legal authority', () => {
      expect(SANGGUNIAN_ROLE_LABELS.LGU_ADMIN.description).toContain('does not itself prove legal authority');
      expect(SANGGUNIAN_ROLE_LABELS.SANGGUNIAN_SECRETARY.description).toContain('not official journals');
    });
  });
});
