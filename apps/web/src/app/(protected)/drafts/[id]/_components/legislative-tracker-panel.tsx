'use client';

import {
  calculateTransmittalDeadline,
  getDefaultMilestones,
  type JurisdictionLevel,
  LEGISLATIVE_STAGES,
  type LegislativeMilestones,
  type LegislativeStage,
  SANGGUNIAN_ROLE_LABELS,
  type SanggunianRole,
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
  milestones?: LegislativeMilestones;
  currentUserRole?: SanggunianRole;
  onUpdateMilestones?: (milestones: LegislativeMilestones) => void;
  readOnly?: boolean;
};

export function LegislativeTrackerPanel({
  jurisdiction,
  milestones: initialMilestones,
  currentUserRole = 'LEGISLATIVE_STAFF',
  onUpdateMilestones,
  readOnly = false,
}: LegislativeTrackerPanelProps) {
  const [milestones, setMilestones] = useState<LegislativeMilestones>(initialMilestones || getDefaultMilestones());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setMilestones(initialMilestones || getDefaultMilestones());
    setValidationError(null);
  }, [initialMilestones]);

  const currentStageInfo = LEGISLATIVE_STAGES.find((s) => s.stage === milestones.currentStage) || LEGISLATIVE_STAGES[0];
  const roleInfo = SANGGUNIAN_ROLE_LABELS[currentUserRole] || SANGGUNIAN_ROLE_LABELS.LEGISLATIVE_STAFF;

  const handleStageChange = (newStage: LegislativeStage) => {
    const validation = validateStageTransition(
      milestones,
      newStage,
      currentUserRole,
      (jurisdiction as JurisdictionLevel) || 'city',
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Unauthorized or invalid stage transition.');
      return;
    }

    setValidationError(null);
    const updated = { ...milestones, currentStage: newStage };
    setMilestones(updated);
    onUpdateMilestones?.(updated);
  };

  const handleFieldChange = (field: keyof LegislativeMilestones, value: unknown) => {
    setValidationError(null);
    const updated = { ...milestones, [field]: value };
    if (field === 'transmittedDate' && typeof value === 'string' && value) {
      updated.transmittalDeadline = calculateTransmittalDeadline(value, (jurisdiction as JurisdictionLevel) || 'city');
    }
    setMilestones(updated);
    onUpdateMilestones?.(updated);
  };

  const handleVotingChange = (field: 'ayes' | 'nays' | 'abstentions', value: number) => {
    setValidationError(null);
    const currentVoting = milestones.votingRecord || { ayes: 0, nays: 0, abstentions: 0 };
    const updated = {
      ...milestones,
      votingRecord: { ...currentVoting, [field]: Math.max(0, value) },
    };
    setMilestones(updated);
    onUpdateMilestones?.(updated);
  };

  return (
    <Card className='border-border/70 shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Landmark className='h-5 w-5 text-primary' />
            <CardTitle className='text-base font-semibold'>Sanggunian Legislative Tracker</CardTitle>
          </div>
          <Badge variant='outline' className='text-xs font-mono'>
            RA 7160 § 54
          </Badge>
        </div>
        <div className='flex items-center justify-between pt-1 text-xs text-muted-foreground'>
          <span>Track formal 3-Reading milestones and LCE transmittal.</span>
        </div>
        <div className='flex items-center gap-1.5 pt-1'>
          <ShieldCheck className='h-3.5 w-3.5 text-primary' />
          <span className='text-[11px] text-muted-foreground'>Active Statutory Role:</span>
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
              <p className='font-semibold'>Statutory Action Required</p>
              <p className='text-[11px]'>{validationError}</p>
            </div>
          </div>
        ) : null}

        {/* Stage Milestone Steps */}
        <div className='flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-xs'>
          <div className='font-medium text-foreground'>
            Step {currentStageInfo.stepNumber} of 7: {currentStageInfo.label}
          </div>
          <Badge
            data-testid='legislative.tracker.stage-badge'
            className='bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
          >
            {milestones.currentStage.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Quick Stage Selector */}
        <div className='space-y-1.5'>
          <Label htmlFor='advance-stage-select' className='text-xs text-muted-foreground'>
            Advance Legislative Stage
          </Label>
          <Select
            value={milestones.currentStage}
            onValueChange={(val) => handleStageChange(val as LegislativeStage)}
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
              {LEGISLATIVE_STAGES.map((s) => (
                <SelectItem key={s.stage} value={s.stage} className='text-xs'>
                  {s.stepNumber}. {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Milestone Details */}
        <div className='rounded-lg border p-3 text-xs space-y-3 bg-card'>
          {milestones.currentStage === 'FIRST_READING' || milestones.firstReadingDate ? (
            <div className='space-y-2 border-b pb-2.5'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <FileCheck className='h-3.5 w-3.5 text-primary' /> 1st Reading & Committee Referral
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Date of 1st Reading</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.firstReadingDate || ''}
                    onChange={(e) => handleFieldChange('firstReadingDate', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Referred Committee</Label>
                  <Input
                    placeholder='e.g. Laws & Rules'
                    className='h-7 text-xs'
                    value={milestones.referredCommittee || ''}
                    onChange={(e) => handleFieldChange('referredCommittee', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {milestones.currentStage === 'COMMITTEE_REVIEW' || milestones.committeeHearingDate ? (
            <div className='space-y-2 border-b pb-2.5'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <Clock className='h-3.5 w-3.5 text-sky-600' /> Committee Hearing & Public Consultation
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Hearing Date</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.committeeHearingDate || ''}
                    onChange={(e) => handleFieldChange('committeeHearingDate', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Committee Report No.</Label>
                  <Input
                    placeholder='e.g. CR-2025-014'
                    className='h-7 text-xs'
                    value={milestones.committeeReportNo || ''}
                    onChange={(e) => handleFieldChange('committeeReportNo', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {milestones.currentStage === 'THIRD_READING' || milestones.votingRecord?.ayes ? (
            <div className='space-y-2 border-b pb-2.5'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <Vote className='h-3.5 w-3.5 text-emerald-600' /> 3rd Reading Nominal Voting Record
              </div>
              <div className='grid grid-cols-3 gap-2'>
                <div>
                  <Label className='text-[10px] text-emerald-600 font-medium'>Ayes</Label>
                  <Input
                    type='number'
                    className='h-7 text-xs'
                    value={milestones.votingRecord?.ayes || 0}
                    onChange={(e) => handleVotingChange('ayes', parseInt(e.target.value, 10) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-rose-600 font-medium'>Nays</Label>
                  <Input
                    type='number'
                    className='h-7 text-xs'
                    value={milestones.votingRecord?.nays || 0}
                    onChange={(e) => handleVotingChange('nays', parseInt(e.target.value, 10) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-amber-600 font-medium'>Abstain</Label>
                  <Input
                    type='number'
                    className='h-7 text-xs'
                    value={milestones.votingRecord?.abstentions || 0}
                    onChange={(e) => handleVotingChange('abstentions', parseInt(e.target.value, 10) || 0)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {milestones.currentStage === 'TRANSMITTED_TO_LCE' ||
          milestones.currentStage === 'ENACTED' ||
          milestones.transmittedDate ? (
            <div className='space-y-2'>
              <div className='font-semibold text-foreground flex items-center gap-1.5'>
                <Send className='h-3.5 w-3.5 text-purple-600' /> Transmittal to Mayor / Governor
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>Transmitted Date</Label>
                  <Input
                    type='date'
                    className='h-7 text-xs'
                    value={milestones.transmittedDate || ''}
                    onChange={(e) => handleFieldChange('transmittedDate', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>10/15-Day Deadline</Label>
                  <div className='h-7 rounded border bg-muted/30 px-2 flex items-center text-[11px] font-mono'>
                    {milestones.transmittalDeadline || 'Set transmittal date'}
                  </div>
                </div>
              </div>
              <div className='pt-1'>
                <Label className='text-[10px] text-muted-foreground'>Chief Executive Action</Label>
                <Select
                  value={milestones.lceAction || 'PENDING'}
                  onValueChange={(val) => handleFieldChange('lceAction', val)}
                  disabled={readOnly}
                >
                  <SelectTrigger className='h-7 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PENDING' className='text-xs'>
                      Pending Signature
                    </SelectItem>
                    <SelectItem value='APPROVED' className='text-xs'>
                      Approved & Signed
                    </SelectItem>
                    <SelectItem value='VETOED' className='text-xs'>
                      Vetoed with Objections
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {milestones.currentStage === 'DRAFTING' ? (
            <p className='text-muted-foreground text-center py-2'>
              Advance to <strong>1st Reading</strong> once this measure is formally introduced to the Sanggunian.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
