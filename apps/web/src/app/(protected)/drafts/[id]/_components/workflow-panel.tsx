import type { DocumentStatus } from '@lexigov/shared';
import { cn } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Label } from '@lexigov/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { SidePanelCard } from './side-panel-card';
import { type Draft, STATUS_CLASSES, STATUS_OPTIONS } from './types';

type WorkflowPanelProps = {
  draft: Draft;
  status: DocumentStatus;
  onStatusChange: (status: DocumentStatus) => void;
  readOnly?: boolean;
};

export function WorkflowPanel({ draft, status, onStatusChange, readOnly = false }: WorkflowPanelProps) {
  return (
    <SidePanelCard
      title='Editing workflow'
      description='Track internal drafting state separately from legislative milestones.'
    >
      <div className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <Label htmlFor='draft-status'>Draft status</Label>
            <Badge
              data-testid='workflow.panel.status-badge'
              className={cn('border px-3 py-1', STATUS_CLASSES[status] ?? STATUS_CLASSES.DRAFT)}
            >
              {status}
            </Badge>
          </div>
          <Select value={status} onValueChange={(value) => onStatusChange(value as DocumentStatus)} disabled={readOnly}>
            <SelectTrigger id='draft-status' data-testid='workflow.panel.status-select' className='h-11 w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='rounded-lg border bg-muted/20 p-4'>
          <div className='space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Jurisdiction</span>
              <span data-testid='workflow.panel.jurisdiction' className='font-medium capitalize'>
                {draft.jurisdiction}
              </span>
            </div>
            <div className='flex items-start justify-between gap-3'>
              <span className='text-muted-foreground'>Office</span>
              <span data-testid='workflow.panel.office' className='max-w-[180px] text-right font-medium'>
                {draft.jurisdictionName}
              </span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Created</span>
              <span className='font-medium'>{new Date(draft.createdAt).toLocaleDateString()}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Updated</span>
              <span className='font-medium'>{new Date(draft.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </SidePanelCard>
  );
}
