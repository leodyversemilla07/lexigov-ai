import { z } from 'zod';

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() + 1 === month &&
      parsed.getUTCDate() === day
    );
  }, 'Use a valid calendar date');

const optionalDate = z.union([z.literal(''), calendarDate]).optional();

const votingRecordSchema = z
  .object({
    totalMembership: z.number().int().nonnegative().optional(),
    membersPresent: z.number().int().nonnegative().optional(),
    ayes: z.number().int().nonnegative(),
    nays: z.number().int().nonnegative(),
    abstentions: z.number().int().nonnegative(),
    rollCallRecorded: z.boolean().optional(),
  })
  .strict();

export const legislativeMilestonesSchema = z
  .object({
    currentStage: z.enum([
      'DRAFTING',
      'FIRST_READING',
      'COMMITTEE_REVIEW',
      'SECOND_READING',
      'THIRD_READING',
      'TRANSMITTED_TO_LCE',
      'AWAITING_PUNONG_BARANGAY_SIGNATURE',
      'ADOPTED',
      'ENACTED',
      'VETOED',
      'LAPSED_INTO_LAW',
    ]),
    firstReadingDate: optionalDate,
    sponsorName: z.string().max(500).optional(),
    referredCommittee: z.string().max(500).optional(),
    committeeHearingDate: optionalDate,
    committeeReportNo: z.string().max(200).optional(),
    secondReadingDate: optionalDate,
    periodOfAmendmentsDate: optionalDate,
    thirdReadingDate: optionalDate,
    votingRecord: votingRecordSchema.optional(),
    transmittedDate: optionalDate,
    transmittalDeadline: optionalDate,
    lceAction: z.enum(['APPROVED', 'VETOED', 'LAPSED_INTO_LAW', 'PENDING']).optional(),
    lceActionDate: optionalDate,
    vetoMessageReference: z.string().max(500).optional(),
    vetoOverrideDate: optionalDate,
    vetoOverrideVotingRecord: votingRecordSchema.optional(),
    punongBarangaySignatureDate: optionalDate,
    enactmentBasis: z
      .enum(['LCE_APPROVAL', 'VETO_OVERRIDE', 'DEEMED_APPROVED', 'BARANGAY_MAJORITY_AND_SIGNATURE'])
      .optional(),
    enactmentNo: z.string().max(200).optional(),
  })
  .strict();
export type LegislativeMilestonesInput = z.infer<typeof legislativeMilestonesSchema>;
