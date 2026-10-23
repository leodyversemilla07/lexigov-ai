'use client';

import {
  calculateTransmittalDeadline,
  getDefaultMilestones,
  getLegislativeStages,
  type JurisdictionLevel,
  type LegislativeMilestones,
  type LegislativeStage,
  SANGGUNIAN_ROLE_LABELS,
  type SanggunianRole,
  type VotingRecord,
  validateStageTransition,
} from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { AlertCircle, Clock, FileCheck, Landmark, Send, ShieldCheck, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';

type LegislativeTrackerPanelProps = {
  jurisdiction: string;
  documentType?: string;
  milestones?: LegislativeMilestones;
  currentUserRole?: SanggunianRole;
  onUpdateMilestones?: (milestones: LegislativeMilestones) => void;
  readOnly?: boolean;
};

const EMPTY_VOTE: VotingRecord = {
  totalMembership: 0,
  membersPresent: 0,
  ayes: 0,
  nays: 0,
  abstentions: 0,
  rollCallRecorded: false,
};

export function LegislativeTrackerPanel({
  jurisdiction,
  documentType = 'ORDINANCE',
  milestones: initialMilestones,
  currentUserRole = 'LEGISLATIVE_STAFF',
  onUpdateMilestones,
  readOnly = false,
}: LegislativeTrackerPanelProps) {
  const [milestones, setMilestones] = useState<LegislativeMilestones>(initialMilestones || getDefaultMilestones());
  const [validationError, setValidationError] = useState<string | null>(null);
  const jurisdictionLevel = (jurisdiction as JurisdictionLevel) || 'city';
  const stages = getLegislativeStages(jurisdictionLevel, documentType);

  useEffect(() => {
    setMilestones(initialMilestones || getDefaultMilestones());
    setValidationError(null);
  }, [initialMilestones]);

  const currentStageInfo = stages.find((stage) => stage.stage === milestones.currentStage) ?? stages[0];
  const roleInfo = SANGGUNIAN_ROLE_LABELS[currentUserRole] || SANGGUNIAN_ROLE_LABELS.LEGISLATIVE_STAFF;

  const updateMilestones = (updated: LegislativeMilestones) => {
    setValidationError(null);
    setMilestones(updated);
    onUpdateMilestones?.(updated);
  };

  const handleStageChange = (newStage: LegislativeStage) => {
    const updated = { ...milestones, currentStage: newStage };
    if (newStage === 'ENACTED' && milestones.currentStage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE') {
      updated.enactmentBasis = 'BARANGAY_MAJORITY_AND_SIGNATURE';
    } else if (newStage === 'ENACTED' && milestones.currentStage === 'VETOED') {
      updated.enactmentBasis = 'VETO_OVERRIDE';
    }
    const validation = validateStageTransition(
      milestones,
      newStage,
      currentUserRole,
      jurisdictionLevel,
      updated,
      documentType,
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Unauthorized or invalid stage transition.');
      return;
    }
    updateMilestones(updated);
  };

  const handleFieldChange = (field: keyof LegislativeMilestones, value: unknown) => {
    const updated = { ...milestones, [field]: value };
    if (field === 'transmittedDate') {
      updated.transmittalDeadline =
        typeof value === 'string' && value ? calculateTransmittalDeadline(value, jurisdictionLevel) : undefined;
    }
    if (field === 'lceAction') {
      updated.enactmentBasis = value === 'APPROVED' ? 'LCE_APPROVAL' : undefined;
      if (value !== 'VETOED') updated.vetoMessageReference = undefined;
    }
    updateMilestones(updated);
  };

  const handleVotingChange = (
    recordField: 'votingRecord' | 'vetoOverrideVotingRecord',
    field: keyof VotingRecord,
    value: number | boolean,
  ) => {
    const currentVoting = milestones[recordField] || EMPTY_VOTE;
    updateMilestones({
      ...milestones,
      [recordField]: {
        ...currentVoting,
        [field]: typeof value === 'number' ? Math.max(0, value) : value,
      },
    });
  };

  const renderVotingRecord = (recordField: 'votingRecord' | 'vetoOverrideVotingRecord', title: string) => {
    const voting = milestones[recordField] || EMPTY_VOTE;
    return (
      <div className='space-y-2.5'>
        <div className='font-semibold text-foreground flex items-center gap-1.5'>
          <Vote className='h-3.5 w-3.5 text-emerald-600' /> {title}
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Label className='text-[10px] text-muted-foreground'>Total elected and qualified membership</Label>
            <Input
              type='number'
              min={0}
              className='h-7 text-xs'
              value={voting.totalMembership || 0}
              onChange={(event) =>
                handleVotingChange(recordField, 'totalMembership', Number.parseInt(event.target.value, 10) || 0)
              }
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className='text-[10px] text-muted-foreground'>Members present</Label>
            <Input
              type='number'
              min={0}
              className='h-7 text-xs'
              value={voting.membersPresent || 0}
              onChange={(event) =>
                handleVotingChange(recordField, 'membersPresent', Number.parseInt(event.target.value, 10) || 0)
              }
              disabled={readOnly}
            />
          </div>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {(['ayes', 'nays', 'abstentions'] as const).map((field) => (
            <div key={field}>
              <Label className='text-[10px] text-muted-foreground capitalize'>{field}</Label>
              <Input
                type='number'
                min={0}
                className='h-7 text-xs'
                value={voting[field] || 0}
                onChange={(event) =>
                  handleVotingChange(recordField, field, Number.parseInt(event.target.value, 10) || 0)
                }
                disabled={readOnly}
              />
            </div>
          ))}
        </div>
        <label className='flex items-start gap-2 rounded border bg-muted/20 p-2 text-[11px] text-muted-foreground'>
          <input
            type='checkbox'
            className='mt-0.5'
            checked={voting.rollCallRecorded === true}
            onChange={(event) => handleVotingChange(recordField, 'rollCallRecorded', event.target.checked)}
            disabled={readOnly}
          />
          The nominal roll-call entry is supported by a separately retained legislative record.
        </label>
      </div>
    );
  };

  const showsVote = [
    'THIRD_READING',
    'TRANSMITTED_TO_LCE',
    'AWAITING_PUNONG_BARANGAY_SIGNATURE',
    'ADOPTED',
    'ENACTED',
    'VETOED',
  ].includes(milestones.currentStage);
  const showsLce =
    jurisdictionLevel !== 'barangay' &&
    documentType.toUpperCase() === 'ORDINANCE' &&
    ['THIRD_READING', 'TRANSMITTED_TO_LCE', 'VETOED', 'ENACTED'].includes(milestones.currentStage);

  return (
    <Card className='border-border/70 shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Landmark className='h-5 w-5 text-primary' />
            <CardTitle className='text-base font-semibold'>Sanggunian Milestone Tracker</CardTitle>
          </div>
          <Badge variant='outline' className='text-xs font-mono'>
            Advisory record
          </Badge>
        </div>
        <p className='pt-1 text-xs text-muted-foreground'>
          Unverified workspace entries do not replace official journals, minutes, signatures, or legal review.
        </p>
        <div className='flex items-center gap-1.5 pt-1'>
          <ShieldCheck className='h-3.5 w-3.5 text-primary' />
          <span className='text-[11px] text-muted-foreground'>Workspace role:</span>
          <Badge data-testid='legislative.tracker.active-role' variant='secondary' className='text-[10px] py-0 px-2'>
            {roleInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {validationError ? (
          <div
            data-testid='legislative.tracker.validation-error'
            className='rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2'
          >
            <AlertCircle className='h-4 w-4 shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold'>Workflow evidence required</p>
              <p className='text-[11px]'>{validationError}</p>
            </div>
          </div>
        ) : null}

        <div className='flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-xs'>
          <div className='font-medium text-foreground'>
            Milestone {currentStageInfo?.stepNumber ?? 1}: {currentStageInfo?.label ?? 'Preparation & Drafting'}
          </div>
          <Badge
            data-testid='legislative.tracker.stage-badge'
            className='bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
          >
            {milestones.currentStage.replace(/_/g, ' ')}
          </Badge>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='advance-stage-select' className='text-xs text-muted-foreground'>
            Record next milestone
          </Label>
          <Select
            value={milestones.currentStage}
            onValueChange={(value) => handleStageChange(value as LegislativeStage)}
            disabled={readOnly}
          >
            <SelectTrigger
              id='advance-stage-select'
              data-testid='legislative.tracker.stage-select'
              className='h-9 text-xs'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.stage} value={stage.stage} className='text-xs'>
                  {stage.stepNumber}. {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='rounded-lg border p-3 text-xs space-y-3 bg-card'>
          <div className='space-y-2 border-b pb-2.5'>
            <div className='font-semibold text-foreground flex items-center gap-1.5'>
              <FileCheck className='h-3.5 w-3.5 text-primary' /> Reading and referral record
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[10px] text-muted-foreground'>First-reading date</Label>
                <Input
                  type='date'
                  className='h-7 text-xs'
                  value={milestones.firstReadingDate || ''}
                  onChange={(event) => handleFieldChange('firstReadingDate', event.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className='text-[10px] text-muted-foreground'>Referred committee</Label>
                <Input
                  placeholder='Committee shown in record'
                  className='h-7 text-xs'
                  value={milestones.referredCommittee || ''}
                  onChange={(event) => handleFieldChange('referredCommittee', event.target.value)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          {[
            'COMMITTEE_REVIEW',
            'SECOND_READING',
            'THIRD_READING',
            'TRANSMITTED_TO_LCE',
            'AWAITING_PUNONG_BARANGAY_SIGNATURE',
            'ADOPTED',
            'VETOED',
            'ENACTED',
          ].includes(milestones.currentStage) || milestones.committeeHearingDate ? (
            <div className='space-y-2 border-b pb-2.5'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <Clock className='h-3.5 w-3.5 text-sky-600' /> Committee and reading dates
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Hearing date, if documented</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.committeeHearingDate || ''}
                    onChange={(event) => handleFieldChange('committeeHearingDate', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Committee report reference</Label>
                  <Input
                    placeholder='Reference shown in record'
                    className='h-7 text-xs'
                    value={milestones.committeeReportNo || ''}
                    onChange={(event) => handleFieldChange('committeeReportNo', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Second-reading date</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.secondReadingDate || ''}
                    onChange={(event) => handleFieldChange('secondReadingDate', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Third-reading date</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.thirdReadingDate || ''}
                    onChange={(event) => handleFieldChange('thirdReadingDate', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {showsVote ? (
            <div className='border-b pb-2.5'>{renderVotingRecord('votingRecord', 'Recorded vote details')}</div>
          ) : null}

          {milestones.currentStage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE' ||
          (jurisdictionLevel === 'barangay' && milestones.currentStage === 'ENACTED') ? (
            <div className='space-y-2'>
              <div className='font-semibold'>Punong Barangay signature record</div>
              <Input
                type='date'
                className='h-7 text-xs'
                value={milestones.punongBarangaySignatureDate || ''}
                onChange={(event) => {
                  handleFieldChange('punongBarangaySignatureDate', event.target.value);
                }}
                disabled={readOnly}
              />
              <p className='text-[10px] text-muted-foreground'>
                Enter the supported date first. Selecting ENACTED records the barangay majority-and-signature basis.
              </p>
            </div>
          ) : null}

          {showsLce ? (
            <div className='space-y-2'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <Send className='h-3.5 w-3.5 text-purple-600' /> Mayor/Governor action record
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Transmittal date</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.transmittedDate || ''}
                    onChange={(event) => handleFieldChange('transmittedDate', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Indicative 10/15-day date</Label>
                  <div className='h-7 rounded border bg-muted/30 px-2 flex items-center text-[11px] font-mono'>
                    {milestones.transmittalDeadline || 'Set transmittal date'}
                  </div>
                </div>
                {milestones.currentStage !== 'THIRD_READING' ? (
                  <>
                    <div>
                      <Label className='text-[10px] text-muted-foreground'>Executive action date</Label>
                      <Input
                        type='date'
                        className='h-7 text-xs'
                        value={milestones.lceActionDate || ''}
                        onChange={(event) => handleFieldChange('lceActionDate', event.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label className='text-[10px] text-muted-foreground'>Recorded action</Label>
                      <Select
                        value={milestones.lceAction || 'PENDING'}
                        onValueChange={(value) => handleFieldChange('lceAction', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger className='h-7 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='PENDING' className='text-xs'>
                            Pending
                          </SelectItem>
                          <SelectItem value='APPROVED' className='text-xs'>
                            Approval/signature recorded
                          </SelectItem>
                          <SelectItem value='VETOED' className='text-xs'>
                            Veto recorded
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </div>
              {milestones.lceAction === 'VETOED' || milestones.currentStage === 'VETOED' ? (
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Written veto objections reference</Label>
                  <Input
                    placeholder='Document or records-system reference'
                    className='h-7 text-xs'
                    value={milestones.vetoMessageReference || ''}
                    onChange={(event) => handleFieldChange('vetoMessageReference', event.target.value)}
                    disabled={readOnly}
                  />
                </div>
              ) : null}
              <p className='text-[10px] text-muted-foreground'>
                The displayed deadline is a calendar-date aid only. Verify legal time computation independently.
              </p>
            </div>
          ) : null}

          {milestones.currentStage === 'VETOED' ? (
            <div className='space-y-2 border-t pt-3'>
              <div>
                <Label className='text-[10px] text-muted-foreground'>Veto-override date</Label>
                <Input
                  type='date'
                  className='h-7 text-xs'
                  value={milestones.vetoOverrideDate || ''}
                  onChange={(event) => handleFieldChange('vetoOverrideDate', event.target.value)}
                  disabled={readOnly}
                />
              </div>
              {renderVotingRecord('vetoOverrideVotingRecord', 'Recorded veto-override vote')}
            </div>
          ) : null}

          {milestones.currentStage === 'DRAFTING' ? (
            <p className='text-muted-foreground text-center py-2'>
              Record the first-reading date from the appropriate source record before advancing.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
