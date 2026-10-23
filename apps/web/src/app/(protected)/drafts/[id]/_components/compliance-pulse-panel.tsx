import { cn } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { SidePanelCard } from './side-panel-card';
import type { ComplianceReport, ComplianceSummaryData } from './types';

type CompliancePulsePanelProps = {
  latestCompliance: ComplianceSummaryData | null | undefined;
  complianceHistory: ComplianceReport[] | undefined;
};

export function CompliancePulsePanel({ latestCompliance, complianceHistory }: CompliancePulsePanelProps) {
  return (
    <SidePanelCard title='Advisory review pulse' description='Automated drafting signals; not a legal certification.'>
      <div className='space-y-4'>
        <div className='rounded-lg border bg-muted/20 p-4'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <div className='text-sm text-muted-foreground'>Latest score</div>
              <div className='mt-1 text-3xl font-semibold tracking-tight'>
                {latestCompliance ? `${latestCompliance.overallScore}/100` : '--'}
              </div>
            </div>
            <Badge
              className={cn(
                'rounded-full border px-3 py-1',
                latestCompliance?.isValid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
              )}
            >
              {latestCompliance ? (latestCompliance.isValid ? 'No critical flags' : 'Issues flagged') : 'Not checked'}
            </Badge>
          </div>
          <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
            <div className='rounded-lg bg-background px-2 py-3'>
              <div className='text-lg font-semibold'>{latestCompliance?.issuesCount ?? 0}</div>
              <div className='text-[11px] uppercase tracking-[0.16em] text-muted-foreground'>Issues</div>
            </div>
            <div className='rounded-lg bg-background px-2 py-3'>
              <div className='text-lg font-semibold'>{latestCompliance?.warningsCount ?? 0}</div>
              <div className='text-[11px] uppercase tracking-[0.16em] text-muted-foreground'>Warnings</div>
            </div>
            <div className='rounded-lg bg-background px-2 py-3'>
              <div className='text-lg font-semibold'>{latestCompliance?.suggestionsCount ?? 0}</div>
              <div className='text-[11px] uppercase tracking-[0.16em] text-muted-foreground'>Tips</div>
            </div>
          </div>
        </div>

        {complianceHistory === undefined ? (
          <Skeleton className='h-28 rounded-2xl' />
        ) : complianceHistory.length === 0 ? (
          <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
            No compliance checks saved yet.
          </div>
        ) : (
          <div className='space-y-3'>
            {complianceHistory.map((report) => (
              <div key={report.id} className='rounded-lg border p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='font-medium'>Version {report.draftVersion}</div>
                  <Badge variant={report.isValid ? 'default' : 'secondary'}>
                    {report.isValid ? 'No critical flags' : 'Issues flagged'}
                  </Badge>
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>{new Date(report.checkedAt).toLocaleString()}</div>
                <div className='mt-3 flex flex-wrap gap-2 text-xs'>
                  <Badge variant='outline'>{report.overallScore}/100</Badge>
                  <Badge variant='outline'>{report.issuesCount} issues</Badge>
                  <Badge variant='outline'>{report.warningsCount} warnings</Badge>
                  <Badge variant='outline'>{report.suggestionsCount} tips</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidePanelCard>
  );
}
