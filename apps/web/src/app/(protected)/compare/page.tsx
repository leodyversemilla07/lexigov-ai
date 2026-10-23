'use client';

import { buildLineDiff, buildSectionDiff, cn, extractDraftSections } from '@lexigov/shared';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { ArrowLeftRight, FileCheck, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useAllDrafts } from '@/hooks/useAllDrafts';
import { useDraftScope } from '@/hooks/useDraftScope';
import { useApiQuery } from '@/lib/api-hooks';
import type { ApiDraft, ApiDraftVersion } from '@/types';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const { organizationId, isLoading: isScopeLoading } = useDraftScope();
  const { data: drafts, error: draftsError, refetch: refetchDrafts } = useAllDrafts({
    organizationId,
    enabled: !isScopeLoading,
  });
  const initialDraftId = searchParams.get('draft') ?? '';
  const [selectedDraftId, setSelectedDraftId] = useState(initialDraftId);
  const { data: versions } = useApiQuery<ApiDraftVersion[]>(
    selectedDraftId ? `/drafts/${selectedDraftId}/versions` : null,
  );
  const [leftVersionId, setLeftVersionId] = useState('');
  const [rightVersionId, setRightVersionId] = useState('');
  const previousScopeRef = useRef(organizationId);

  useEffect(() => {
    if (previousScopeRef.current === organizationId) return;
    previousScopeRef.current = organizationId;
    setSelectedDraftId('');
    setLeftVersionId('');
    setRightVersionId('');
  }, [organizationId]);

  const draftOptions = drafts ?? [];
  const versionOptions = versions ?? [];
  const versionsLoading = Boolean(selectedDraftId) && versions === undefined;

  const selectedDraft = draftOptions.find((draft: ApiDraft) => draft.id === selectedDraftId);
  const currentVersion = versionOptions.find((version) => version.isCurrent) ?? versionOptions[0];
  const previousVersion =
    versionOptions.find((version) => !version.isCurrent) ?? versionOptions[versionOptions.length - 1];
  const resolvedLeftVersionId =
    leftVersionId && versionOptions.some((version) => version.id === leftVersionId)
      ? leftVersionId
      : (previousVersion?.id ?? '');
  const resolvedRightVersionId =
    rightVersionId && versionOptions.some((version) => version.id === rightVersionId)
      ? rightVersionId
      : (currentVersion?.id ?? '');
  const leftVersion = versionOptions.find((version) => version.id === resolvedLeftVersionId);
  const rightVersion = versionOptions.find((version) => version.id === resolvedRightVersionId);
  const diffRows = leftVersion && rightVersion ? buildLineDiff(leftVersion.body, rightVersion.body) : [];
  const leftSections = leftVersion ? extractDraftSections({ body: leftVersion.body }) : [];
  const rightSections = rightVersion ? extractDraftSections({ body: rightVersion.body }) : [];
  const sectionDiffRows = leftVersion && rightVersion ? buildSectionDiff(leftSections, rightSections) : [];
  const changedRows = diffRows.filter((row) => row.type !== 'same').length;
  const changedSections = sectionDiffRows.filter((row) => row.type === 'changed').length;
  const addedSections = sectionDiffRows.filter((row) => row.type === 'added').length;
  const removedSections = sectionDiffRows.filter((row) => row.type === 'removed').length;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Version Comparison</h1>
        <p className='text-muted-foreground'>Compare saved revisions and the current working draft side by side.</p>
      </div>

      <div className='grid gap-6 lg:grid-cols-4'>
        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Select Draft</CardTitle>
              <CardDescription>Choose the draft whose saved versions you want to compare.</CardDescription>
            </CardHeader>
            <CardContent>
              {drafts === undefined && !draftsError ? (
                <Skeleton className='h-10' />
              ) : draftsError ? (
                <div className='space-y-3 text-sm text-destructive'>
                  <p>Unable to load the complete draft list.</p>
                  <Button variant='outline' size='sm' onClick={() => void refetchDrafts()}>Retry</Button>
                </div>
              ) : (
                <Select
                  value={selectedDraftId}
                  onValueChange={(value) => {
                    setSelectedDraftId(value);
                    setLeftVersionId('');
                    setRightVersionId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a draft' />
                  </SelectTrigger>
                  <SelectContent>
                    {draftOptions.map((draft: ApiDraft) => (
                      <SelectItem key={draft.id} value={draft.id}>
                        {draft.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedDraft && versionOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Version Picks</CardTitle>
                <CardDescription>Choose any two saved states from {selectedDraft.title}.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>Left side</div>
                  <Select value={resolvedLeftVersionId} onValueChange={setLeftVersionId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select version A' />
                    </SelectTrigger>
                    <SelectContent>
                      {versionOptions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} {version.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>Right side</div>
                  <Select value={resolvedRightVersionId} onValueChange={setRightVersionId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select version B' />
                    </SelectTrigger>
                    <SelectContent>
                      {versionOptions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} {version.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className='lg:col-span-3 space-y-6'>
          {!selectedDraft ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <FileCheck className='h-10 w-10 mx-auto mb-3 text-muted-foreground' />
                <p className='font-medium'>Select a draft to compare its versions</p>
              </CardContent>
            </Card>
          ) : versionsLoading ? (
            <Card>
              <CardContent className='py-12'>
                <Skeleton className='h-64' />
              </CardContent>
            </Card>
          ) : versionOptions.length < 2 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <GitCompareArrows className='h-10 w-10 mx-auto mb-3 text-muted-foreground' />
                <p className='font-medium'>No saved revision history yet</p>
                <p className='text-sm text-muted-foreground mt-2'>
                  Save the draft at least once after editing to create a revision you can compare.
                </p>
              </CardContent>
            </Card>
          ) : leftVersion && rightVersion ? (
            <>
              <div className='grid gap-4 md:grid-cols-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Draft</CardDescription>
                    <CardTitle className='text-base'>{selectedDraft.title}</CardTitle>
                  </CardHeader>
                  <CardContent className='text-sm text-muted-foreground'>
                    {selectedDraft.documentType} • {selectedDraft.jurisdictionName}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Versions Compared</CardDescription>
                    <CardTitle className='text-base'>
                      v{leftVersion.version} vs v{rightVersion.version}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='text-sm text-muted-foreground'>
                    {leftVersion.isCurrent || rightVersion.isCurrent
                      ? 'Includes current draft'
                      : 'Historical comparison'}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Section Changes</CardDescription>
                    <CardTitle className='text-base'>{changedSections} changed</CardTitle>
                  </CardHeader>
                  <CardContent className='text-sm text-muted-foreground'>
                    {addedSections} added, {removedSections} removed
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Changed Rows</CardDescription>
                    <CardTitle className='text-base'>{changedRows}</CardTitle>
                  </CardHeader>
                  <CardContent className='text-sm text-muted-foreground'>
                    Based on a line-by-line diff of draft bodies
                  </CardContent>
                </Card>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                {[leftVersion, rightVersion].map((version, index) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <CardTitle className='text-base'>
                        {index === 0 ? 'Left' : 'Right'}: v{version.version} {version.isCurrent ? '(Current)' : ''}
                      </CardTitle>
                      <CardDescription>{new Date(version.updatedAt).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Status</span>
                        <span>{version.status}</span>
                      </div>
                      {version.commitMessage && <div className='text-muted-foreground'>{version.commitMessage}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Section Diff</CardTitle>
                  <CardDescription>
                    Compare how the structured ordinance sections changed between these versions.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {sectionDiffRows.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                      No parsed sections were found in either version.
                    </div>
                  ) : (
                    sectionDiffRows.map((row) => (
                      <div
                        key={row.key}
                        className={cn(
                          'rounded-lg border p-4',
                          row.type === 'changed' && 'border-amber-300 bg-amber-50',
                          row.type === 'added' && 'border-emerald-300 bg-emerald-50',
                          row.type === 'removed' && 'border-rose-300 bg-rose-50',
                        )}
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <div className='font-medium'>{row.heading}</div>
                          <span className='text-xs uppercase tracking-wide text-muted-foreground'>{row.type}</span>
                        </div>
                        <div className='mt-3 grid gap-3 md:grid-cols-2'>
                          <div className='rounded-md bg-background/70 p-3'>
                            <div className='mb-2 text-xs font-medium text-muted-foreground'>Left</div>
                            <div className='whitespace-pre-wrap text-sm'>{row.leftBody || 'No content'}</div>
                          </div>
                          <div className='rounded-md bg-background/70 p-3'>
                            <div className='mb-2 text-xs font-medium text-muted-foreground'>Right</div>
                            <div className='whitespace-pre-wrap text-sm'>{row.rightBody || 'No content'}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle>Line Diff</CardTitle>
                    <CardDescription>
                      Removed lines are highlighted on the left. Added lines are highlighted on the right.
                    </CardDescription>
                  </div>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/drafts/${selectedDraftId}`}>
                      <ArrowLeftRight className='mr-2 h-4 w-4' />
                      Open Draft
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto rounded-lg border'>
                    <table className='w-full border-collapse text-sm'>
                      <thead>
                        <tr className='bg-muted/50'>
                          <th className='w-16 border-b px-3 py-2 text-left'>Left</th>
                          <th className='border-b px-3 py-2 text-left'>v{leftVersion.version}</th>
                          <th className='w-16 border-b px-3 py-2 text-left'>Right</th>
                          <th className='border-b px-3 py-2 text-left'>v{rightVersion.version}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffRows.map((row) => (
                          <tr
                            key={`${row.type}-${row.leftLineNumber ?? 'l'}-${row.rightLineNumber ?? 'r'}-${row.leftText}-${row.rightText}`}
                            className={cn(
                              'align-top',
                              row.type === 'added' && 'bg-emerald-50',
                              row.type === 'removed' && 'bg-rose-50',
                            )}
                          >
                            <td className='border-b px-3 py-2 text-muted-foreground'>{row.leftLineNumber ?? ''}</td>
                            <td className='border-b px-3 py-2 whitespace-pre-wrap font-mono'>{row.leftText}</td>
                            <td className='border-b px-3 py-2 text-muted-foreground'>{row.rightLineNumber ?? ''}</td>
                            <td className='border-b px-3 py-2 whitespace-pre-wrap font-mono'>{row.rightText}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CompareLoading() {
  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-5 w-96' />
      </div>
      <div className='grid gap-6 lg:grid-cols-4'>
        <div className='space-y-6'>
          <Skeleton className='h-40' />
          <Skeleton className='h-56' />
        </div>
        <div className='lg:col-span-3 space-y-6'>
          <Skeleton className='h-48' />
          <Skeleton className='h-[520px]' />
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareLoading />}>
      <ComparePageContent />
    </Suspense>
  );
}
