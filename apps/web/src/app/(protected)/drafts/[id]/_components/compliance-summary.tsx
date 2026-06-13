import { cn } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import type { ComplianceResult } from './types';

type ComplianceSummaryProps = {
  complianceResult: ComplianceResult;
  isCheckingCompliance: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
};

export function ComplianceSummary({
  complianceResult,
  isCheckingCompliance,
  onRefresh,
  onDismiss,
}: ComplianceSummaryProps) {
  return (
    <Card
      className={cn(
        '',
        complianceResult.isValid ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/90',
      )}
    >
      <CardHeader className='sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex items-start gap-3'>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl border',
              complianceResult.isValid
                ? 'border-emerald-200 bg-white text-emerald-700'
                : 'border-amber-200 bg-white text-amber-700',
            )}
          >
            {complianceResult.isValid ? <CheckCircle2 className='h-5 w-5' /> : <AlertTriangle className='h-5 w-5' />}
          </div>
          <div>
            <CardTitle className='text-lg'>RA 7160 Compliance Snapshot</CardTitle>
            <CardDescription className='mt-1 text-sm text-foreground/70'>
              Score {complianceResult.overallScore}/100 with {complianceResult.issues.length} flagged
              {complianceResult.issues.length === 1 ? ' issue' : ' issues'}.
            </CardDescription>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' onClick={onRefresh} disabled={isCheckingCompliance}>
            {isCheckingCompliance ? (
              <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-3.5 w-3.5' />
            )}
            Re-check
          </Button>
          <Button variant='ghost' size='icon-sm' onClick={onDismiss}>
            <XCircle className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 p-4 sm:p-6'>
        {complianceResult.issues.length === 0 ? (
          <div className='rounded-2xl border border-emerald-200 bg-white/80 p-4 text-sm text-emerald-800'>
            No issues were found in this pass.
          </div>
        ) : (
          complianceResult.issues.map((issue) => (
            <div
              key={`${issue.type}-${issue.section ?? 'general'}-${issue.title}`}
              className={cn(
                'rounded-2xl border p-4 shadow-sm',
                issue.type === 'critical' && 'border-red-200 bg-red-50/80',
                issue.type === 'warning' && 'border-amber-200 bg-amber-50/90',
                issue.type === 'suggestion' && 'border-sky-200 bg-sky-50/80',
              )}
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-sm font-semibold'>{issue.title}</div>
                  {issue.section ? (
                    <div className='mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground'>
                      {issue.section}
                    </div>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    'rounded-full border capitalize',
                    issue.type === 'critical' && 'border-red-300 bg-white text-red-700',
                    issue.type === 'warning' && 'border-amber-300 bg-white text-amber-700',
                    issue.type === 'suggestion' && 'border-sky-300 bg-white text-sky-700',
                  )}
                >
                  {issue.type}
                </Badge>
              </div>
              <p className='mt-3 text-sm leading-6 text-foreground/80'>{issue.description}</p>
              {issue.suggestion ? (
                <div className='mt-3 rounded-xl bg-white/75 p-3 text-sm leading-6 text-foreground/75'>
                  <span className='font-medium text-foreground'>Suggested fix:</span> {issue.suggestion}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
