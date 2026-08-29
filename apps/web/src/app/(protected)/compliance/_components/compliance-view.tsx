'use client';

import { cn, extractDraftBody } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { AlertTriangle, CheckCircle, FileText, Loader2, RefreshCw, Scale, Shield, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-hooks';
import type { ApiComplianceReport, ApiComplianceResult, ApiDraft, PaginatedResponse } from '@/types';

export function CompliancePageContent() {
  const searchParams = useSearchParams();
  const initialDraftId = searchParams.get('draft');

  const { data: draftsPage } = useApiQuery<PaginatedResponse<ApiDraft>>('/drafts');
  const drafts = draftsPage?.data;

  const [selectedDraftId, setSelectedDraftId] = useState<string>(initialDraftId || '');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ApiComplianceResult | null>(null);

  const selectedDraft = drafts?.find((d: ApiDraft) => d.id === selectedDraftId);
  const { data: reportHistory, refetch: refetchReportHistory } = useApiQuery<ApiComplianceReport[]>(
    selectedDraftId ? `/compliance/${selectedDraftId}` : null,
  );

  const getContent = (draft: ApiDraft): string => {
    return extractDraftBody(draft.content);
  };

  const handleCheckCompliance = async () => {
    if (!selectedDraft) return;

    setIsChecking(true);
    setResult(null);

    try {
      const complianceResult = await api.post<ApiComplianceResult>(`/compliance/${selectedDraft.id}/check`);
      setResult(complianceResult);
      await refetchReportHistory();
      toast.success('Compliance check complete.');
    } catch (error) {
      console.error('Failed to check compliance:', error);
      toast.error('Failed to check compliance. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
      default:
        return <CheckCircle className='h-4 w-4 text-blue-600' />;
    }
  };

  const issueCounts = result
    ? {
        critical: result.issues.filter((i) => i.type === 'critical').length,
        warning: result.issues.filter((i) => i.type === 'warning').length,
        suggestion: result.issues.filter((i) => i.type === 'suggestion').length,
      }
    : { critical: 0, warning: 0, suggestion: 0 };

  const isLoading = draftsPage === undefined;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Compliance Check</h1>
        <p className='text-muted-foreground'>Verify your drafts against RA 7160 (Local Government Code)</p>
      </div>

      <div className='grid gap-6 lg:grid-cols-4'>
        {/* Draft Selection */}
        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Select Draft</CardTitle>
              <CardDescription>Choose a draft to check</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-10' />
                  <Skeleton className='h-10' />
                  <Skeleton className='h-10' />
                </div>
              ) : !drafts || drafts.length === 0 ? (
                <div className='text-center py-4'>
                  <FileText className='h-8 w-8 mx-auto text-muted mb-2' />
                  <p className='text-sm text-muted-foreground'>No drafts found</p>
                  <Button variant='outline' size='sm' className='mt-2' asChild>
                    <Link href='/drafts/new'>Create Draft</Link>
                  </Button>
                </div>
              ) : (
                <Select value={selectedDraftId} onValueChange={setSelectedDraftId}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a draft' />
                  </SelectTrigger>
                  <SelectContent>
                    {drafts.map((draft: ApiDraft) => (
                      <SelectItem key={draft.id} value={draft.id}>
                        <div className='truncate'>
                          <div className='font-medium truncate'>{draft.title}</div>
                          <div className='text-xs text-muted-foreground'>
                            {draft.documentType} • {draft.jurisdictionName}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedDraft && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Selected Draft</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div>
                  <div className='font-medium'>{selectedDraft.title}</div>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Type</span>
                  <Badge variant='outline'>{selectedDraft.documentType}</Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Jurisdiction</span>
                  <span className='capitalize'>{selectedDraft.jurisdiction}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Status</span>
                  <Badge variant='secondary'>{selectedDraft.status}</Badge>
                </div>
                <Button
                  className='w-full mt-4'
                  onClick={handleCheckCompliance}
                  disabled={isChecking || !getContent(selectedDraft)}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Shield className='mr-2 h-4 w-4' />
                      Check Compliance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedDraft && reportHistory && reportHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Recent Checks</CardTitle>
                <CardDescription>Latest saved compliance reports for this draft</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                {reportHistory.map((report) => (
                  <div key={report.id} className='rounded-lg border p-3'>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='font-medium'>
                        v{report.draftVersion} · {report.overallScore}/100
                      </span>
                      <Badge variant={report.isValid ? 'default' : 'secondary'}>
                        {report.isValid ? 'Compliant' : 'Needs Review'}
                      </Badge>
                    </div>
                    <div className='mt-2 text-muted-foreground'>{new Date(report.checkedAt).toLocaleString()}</div>
                    <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                      <Badge variant='outline'>{report.issuesCount} issues</Badge>
                      <Badge variant='outline'>{report.warningsCount} warnings</Badge>
                      <Badge variant='outline'>{report.suggestionsCount} suggestions</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className='lg:col-span-3 space-y-6'>
          {/* Score Cards */}
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardDescription>Overall Score</CardDescription>
                <Scale className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className={cn('text-3xl font-bold', result ? getScoreColor(result.overallScore) : 'text-muted')}>
                  {result ? `${result.overallScore}` : '—'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardDescription>Critical</CardDescription>
                <XCircle className='h-4 w-4 text-red-500' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-red-600'>{issueCounts.critical}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardDescription>Warnings</CardDescription>
                <AlertTriangle className='h-4 w-4 text-yellow-500' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-yellow-600'>{issueCounts.warning}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardDescription>Suggestions</CardDescription>
                <CheckCircle className='h-4 w-4 text-blue-500' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-blue-600'>{issueCounts.suggestion}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Result Card */}
          {result ? (
            <Card>
              <CardHeader
                className={cn(
                  'flex flex-row items-center justify-between',
                  result.isValid ? 'bg-green-50' : 'bg-yellow-50',
                )}
              >
                <div className='flex items-center gap-3'>
                  {result.isValid ? (
                    <CheckCircle className='h-8 w-8 text-green-600' />
                  ) : (
                    <AlertTriangle className='h-8 w-8 text-yellow-600' />
                  )}
                  <div>
                    <CardTitle>{result.isValid ? 'Compliant' : 'Needs Review'}</CardTitle>
                    <CardDescription>
                      {result.isValid
                        ? 'This draft appears to comply with RA 7160 requirements'
                        : 'This draft has issues that should be addressed'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant='outline' size='sm' onClick={handleCheckCompliance} disabled={isChecking}>
                  <RefreshCw className={cn('mr-2 h-4 w-4', isChecking && 'animate-spin')} />
                  Re-check
                </Button>
              </CardHeader>
              <CardContent className='pt-4'>
                {result.issues.length === 0 ? (
                  <div className='text-center py-8'>
                    <CheckCircle className='h-12 w-12 mx-auto text-green-500 mb-4' />
                    <h3 className='text-lg font-medium'>No Issues Found</h3>
                    <p className='text-muted-foreground'>
                      Your draft appears to meet all RA 7160 compliance requirements.
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {result.issues.map((issue) => (
                      <div
                        key={`${issue.type}-${issue.section ?? 'general'}-${issue.title}`}
                        className={cn(
                          'rounded-lg border p-4',
                          issue.type === 'critical'
                            ? 'border-red-200 bg-red-50'
                            : issue.type === 'warning'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50',
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          {getIssueIcon(issue.type)}
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <span
                                className={cn(
                                  'font-medium',
                                  issue.type === 'critical'
                                    ? 'text-red-800'
                                    : issue.type === 'warning'
                                      ? 'text-yellow-800'
                                      : 'text-blue-800',
                                )}
                              >
                                {issue.title}
                              </span>
                              {issue.section && (
                                <Badge variant='outline' className='text-xs'>
                                  {issue.section}
                                </Badge>
                              )}
                            </div>
                            <p className='text-sm mt-1'>{issue.description}</p>
                            {issue.suggestion && (
                              <div className='mt-2 p-2 bg-white/70 rounded text-sm'>
                                <span className='font-medium'>Fix: </span>
                                {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedDraft && reportHistory && reportHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Latest Saved Report</CardTitle>
                <CardDescription>Most recent persisted compliance result for this draft</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className={cn('text-3xl font-bold', getScoreColor(reportHistory[0].overallScore))}>
                        v{reportHistory[0].draftVersion} · {reportHistory[0].overallScore}/100
                      </div>
                      <div className='text-sm text-muted-foreground mt-1'>
                        Checked {new Date(reportHistory[0].checkedAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={reportHistory[0].isValid ? 'default' : 'secondary'}>
                      {reportHistory[0].isValid ? 'Compliant' : 'Needs Review'}
                    </Badge>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-2 text-sm'>
                    <Badge variant='outline'>{reportHistory[0].issuesCount} issues</Badge>
                    <Badge variant='outline'>{reportHistory[0].warningsCount} warnings</Badge>
                    <Badge variant='outline'>{reportHistory[0].suggestionsCount} suggestions</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedDraft ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <Shield className='h-12 w-12 mx-auto text-muted mb-4' />
                <h3 className='text-lg font-medium mb-2'>Ready to Check</h3>
                <p className='text-muted-foreground mb-4'>
                  Click &quot;Check Compliance&quot; to analyze this draft against RA 7160
                </p>
                <Button onClick={handleCheckCompliance} disabled={isChecking}>
                  {isChecking ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Shield className='mr-2 h-4 w-4' />
                      Run Compliance Check
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <FileText className='h-12 w-12 mx-auto text-muted mb-4' />
                <h3 className='text-lg font-medium mb-2'>Select a Draft</h3>
                <p className='text-muted-foreground'>Choose a draft from the list to check its compliance</p>
              </CardContent>
            </Card>
          )}

          {/* Reference Laws */}
          <Card>
            <CardHeader>
              <CardTitle>Applicable Laws & Regulations</CardTitle>
              <CardDescription>Laws checked during compliance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-3 md:grid-cols-2'>
                <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='font-medium'>Republic Act 7160</div>
                    <div className='text-xs text-muted-foreground'>Local Government Code of 1991</div>
                  </div>
                </div>
                <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='font-medium'>1987 Constitution</div>
                    <div className='text-xs text-muted-foreground'>Article X - Local Government</div>
                  </div>
                </div>
                <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='font-medium'>DILG Memorandums</div>
                    <div className='text-xs text-muted-foreground'>Department circulars and guidelines</div>
                  </div>
                </div>
                <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <div className='font-medium'>Civil Code</div>
                    <div className='text-xs text-muted-foreground'>Relevant provisions on obligations</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ComplianceLoading() {
  return (
    <div className='space-y-6'>
      <div>
        <Skeleton className='h-10 w-64 mb-2' />
        <Skeleton className='h-5 w-96' />
      </div>
      <div className='grid gap-6 lg:grid-cols-4'>
        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-40' />
            </CardContent>
          </Card>
        </div>
        <div className='lg:col-span-3 space-y-6'>
          <div className='grid gap-4 md:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <Skeleton className='h-20' />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-60' />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
