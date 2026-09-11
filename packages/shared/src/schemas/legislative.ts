import { z } from 'zod';

const optionalDate = z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format').optional();

export const legislativeMilestonesSchema = z.object({
  currentStage: z.enum([
    'DRAFTING', 'FIRST_READING', 'COMMITTEE_REVIEW', 'SECOND_READING', 'THIRD_READING',
    'TRANSMITTED_TO_LCE', 'ENACTED', 'VETOED', 'LAPSED_INTO_LAW',
  ]),
  firstReadingDate: optionalDate,
  sponsorName: z.string().max(500).optional(),
  referredCommittee: z.string().max(500).optional(),
  committeeHearingDate: optionalDate,
  committeeReportNo: z.string().max(200).optional(),
  secondReadingDate: optionalDate,
  periodOfAmendmentsDate: optionalDate,
  thirdReadingDate: optionalDate,
  votingRecord: z.object({
    ayes: z.number().int().nonnegative(),
    nays: z.number().int().nonnegative(),
    abstentions: z.number().int().nonnegative(),
  }).optional(),
  transmittedDate: optionalDate,
  transmittalDeadline: optionalDate,
  lceAction: z.enum(['APPROVED', 'VETOED', 'LAPSED_INTO_LAW', 'PENDING']).optional(),
  lceActionDate: optionalDate,
  enactmentNo: z.string().max(200).optional(),
});
export type LegislativeMilestonesInput = z.infer<typeof legislativeMilestonesSchema>;
