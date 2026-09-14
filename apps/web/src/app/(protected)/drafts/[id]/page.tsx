'use client';

import type { DocumentStatus, LegislativeMilestones } from '@lexigov/shared';
import {
  buildDraftSectionsFromBody,
  cn,
  createDraftSection,
  type DraftSection,
  extractDraftBody,
  extractDraftMilestones,
  extractDraftSections,
  getDefaultMilestones,
  updateDraftMilestonesContent,
  updateDraftSectionsContent,
} from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { ArrowLeft, CheckCircle, Download, FileText, Loader2, Save, Shield, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useApiQuery } from '@/lib/api-hooks';
import {
  CompliancePulsePanel,
  type ComplianceReport,
  type ComplianceResult,
  ComplianceSummary,
  type ComplianceSummaryData,
  type Draft,
  DraftStudio,
  type DraftVersion,
  LegislativeTrackerPanel,
  MetricCard,
  OfficialExportModal,
  SectionEditor,
  STATUS_CLASSES,
  VersionTrailPanel,
  WorkflowPanel,
} from './_components';

export default function DraftEditorPage() {
  const params = useParams();
  const draftId = params.id as string;
  const { data: session } = useSession();

  // API queries
  const { data: draft, isLoading: draftLoading, refetch: refetchDraft } = useApiQuery<Draft>(`/drafts/${draftId}`);
  const { data: versionHistory, refetch: refetchVersions } = useApiQuery<DraftVersion[]>(`/drafts/${draftId}/versions`);
  const { data: complianceHistory, refetch: refetchComplianceHistory } = useApiQuery<ComplianceReport[]>(
    `/compliance/${draftId}`,
  );

  // Local state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [isRestoringVersionId, setIsRestoringVersionId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [showCompliance, setShowCompliance] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>('DRAFT');
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [milestones, setMilestones] = useState<LegislativeMilestones | undefined>(undefined);
  const [isOfficialExportOpen, setIsOfficialExportOpen] = useState(false);

  // Sync draft data to local state
  useEffect(() => {
    if (!draft) return;

    const body = extractDraftBody(draft.content);
    const parsedSections = extractDraftSections(draft.content);
    const parsedMilestones = extractDraftMilestones(draft.content) || getDefaultMilestones();

    setTitle(draft.title);
    setContent(body);
    setSections(parsedSections);
    setSelectedSectionId(parsedSections[0]?.id ?? '');
    setStatus(draft.status as DocumentStatus);
    setMilestones(parsedMilestones);
  }, [draft]);

  // Computed values
  const sectionOutline = sections.length > 0 ? sections : buildDraftSectionsFromBody(content);
  const selectedSection = sectionOutline.find((s) => s.id === selectedSectionId) ?? sectionOutline[0] ?? null;
  const selectedSectionNumber = selectedSection ? sectionOutline.findIndex((s) => s.id === selectedSection.id) + 1 : 0;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characterCount = content.length;
  const currentComplianceReport = complianceHistory?.find(
    (report) => report.draftVersion === draft?.version && !report.revisionDraftId,
  );
  const isReadOnly = draft?.canEdit === false;
  const latestCompliance: ComplianceSummaryData | null | undefined = complianceResult
    ? {
        overallScore: complianceResult.overallScore,
        isValid: complianceResult.isValid,
        issuesCount: complianceResult.issues.length,
        warningsCount: complianceResult.issues.filter((i) => i.type === 'warning').length,
        suggestionsCount: complianceResult.issues.filter((i) => i.type === 'suggestion').length,
        checkedAt: Date.now(),
      }
    : currentComplianceReport;

  // Section handlers
  const replaceSections = (nextSections: DraftSection[]) => {
    setSections(nextSections);
    setContent(updateDraftSectionsContent({ ...(draft?.content ?? {}), body: content }, nextSections).body);
    if (!nextSections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(nextSections[0]?.id ?? '');
    }
  };

  const handleContentChange = (nextBody: string) => {
    setContent(nextBody);
    const nextSections = buildDraftSectionsFromBody(nextBody);
    setSections(nextSections);
    if (!nextSections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(nextSections[0]?.id ?? '');
    }
  };

  const handleSectionChange = (sectionId: string, field: 'heading' | 'body', value: string) => {
    const nextSections = sectionOutline.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s));
    replaceSections(nextSections);
  };

  const handleAddSection = () => {
    const nextSections = [...sectionOutline, createDraftSection(sectionOutline.length)];
    replaceSections(nextSections);
    setSelectedSectionId(nextSections[nextSections.length - 1]?.id ?? '');
  };

  const handleRemoveSection = (sectionId: string) => {
    const nextSections = sectionOutline.filter((s) => s.id !== sectionId);
    replaceSections(nextSections);
  };

  // Save handlers
  const saveCurrentDraft = async () => {
    if (!draft) throw new Error('Draft not found');
    const baseContent = updateDraftSectionsContent(
      { ...(typeof draft.content === 'object' && draft.content ? draft.content : {}), body: content },
      sections.length > 0 ? sections : buildDraftSectionsFromBody(content),
    );
    const structuredContent = milestones ? updateDraftMilestonesContent(baseContent, milestones) : baseContent;

    return await api.patch<Draft>(`/drafts/${draftId}`, {
      title,
      content: structuredContent,
      status,
      expectedVersion: draft.version,
    });
  };

  const handleSave = async () => {
    if (!draft || isReadOnly) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveCurrentDraft();
      await Promise.all([refetchDraft(), refetchVersions()]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Draft saved.');
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Draft was modified by another session. Please reload to see the latest version.', {
          action: {
            label: 'Reload',
            onClick: () => {
              refetchDraft();
              refetchVersions();
            },
          },
        });
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckCompliance = async () => {
    if (!draft) return;
    setIsCheckingCompliance(true);
    setShowCompliance(true);
    try {
      if (!isReadOnly) await saveCurrentDraft();
      const result = await api.post<ComplianceResult>(`/compliance/${draftId}/check`);
      setComplianceResult(result);
      await Promise.all([refetchDraft(), refetchVersions(), refetchComplianceHistory()]);
      toast.success('Compliance check complete.');
    } catch (error) {
      console.error('Failed to check compliance:', error);
      toast.error('Failed to check compliance. Please try again.');
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (!draft || isReadOnly) return;
    setIsRestoringVersionId(versionId);
    try {
      const savedDraft = await saveCurrentDraft();
      await api.post(`/drafts/${draftId}/restore`, { versionId, expectedVersion: savedDraft.version });
      await Promise.all([refetchDraft(), refetchVersions(), refetchComplianceHistory()]);
      setShowCompliance(false);
      setComplianceResult(null);
      toast.success(`Restored version v${versionNumber}.`);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version. Please try again.');
    } finally {
      setIsRestoringVersionId(null);
    }
  };

  // Loading state
  if (draftLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-44 rounded-3xl' />
        <div className='grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]'>
          <Skeleton className='h-[720px] rounded-3xl' />
          <Skeleton className='h-[720px] rounded-3xl' />
        </div>
      </div>
    );
  }

  // Not found state
  if (!draft) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild aria-label='Back to drafts'>
            <Link href='/drafts'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Draft Not Found</h1>
        </div>
        <Card className='rounded-3xl'>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground'>This draft does not exist or you do not have access.</p>
            <Button className='mt-4' asChild>
              <Link href='/drafts'>Back to Drafts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6 pb-10'>
      {/* Header Section */}
      <section className='space-y-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='min-w-0 space-y-4'>
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className={cn('rounded-full border px-3 py-1', STATUS_CLASSES[status] ?? STATUS_CLASSES.DRAFT)}>
                  {status}
                </Badge>
                {draft.aiGenerated ? (
                  <Badge variant='secondary' className='rounded-full px-3 py-1'>
                    <Sparkles className='mr-1.5 h-3.5 w-3.5' />
                    AI generated
                  </Badge>
                ) : null}
                {draft.organizationId && session?.user.id && draft.userId !== session.user.id ? (
                  <Badge variant='outline' className='rounded-full px-3 py-1'>
                    <Users className='mr-1.5 h-3.5 w-3.5' />
                    Shared organization draft
                  </Badge>
                ) : null}
                <Badge variant='outline' className='rounded-full px-3 py-1'>
                  v{draft.version}
                </Badge>
                {isReadOnly ? (
                  <Badge variant='outline' className='rounded-full px-3 py-1'>
                    Read-only access
                  </Badge>
                ) : null}
              </div>

              <div className='max-w-4xl'>
                <Label htmlFor='draft-title' className='sr-only'>
                  Draft title
                </Label>
                <Input
                  id='draft-title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='h-auto border-0 bg-transparent px-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0'
                  readOnly={isReadOnly}
                />
              </div>

              <p className='max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base'>
                Working draft for {draft.jurisdictionName}. Edit the full ordinance, tune section-level structure, then
                run compliance before export.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
            {saveSuccess ? (
              <div className='mr-1 flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                <CheckCircle className='mr-2 h-4 w-4' />
                Saved
              </div>
            ) : null}
            <Button variant='outline' onClick={handleCheckCompliance} disabled={isCheckingCompliance}>
              {isCheckingCompliance ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Shield className='mr-2 h-4 w-4' />
              )}
              Check compliance
            </Button>
            <Button
              variant='outline'
              onClick={() => setIsOfficialExportOpen(true)}
              data-testid='draft.header.official-export-btn'
            >
              <Download className='mr-2 h-4 w-4 text-primary' />
              Draft Export
            </Button>
            <Button variant='outline' asChild>
              <Link href={`/drafts/${draftId}/preview`}>
                <FileText className='mr-2 h-4 w-4' />
                Preview
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isReadOnly}>
              {isSaving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Save draft
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Words'
            value={wordCount.toLocaleString()}
            detail={`${characterCount.toLocaleString()} characters`}
          />
          <MetricCard
            label='Sections'
            value={sectionOutline.length.toString()}
            detail={selectedSection ? `Focused on section ${selectedSectionNumber}` : 'No structured sections yet'}
          />
          <MetricCard
            label='Compliance'
            value={latestCompliance ? `${latestCompliance.overallScore}/100` : 'Pending'}
            detail={
              latestCompliance
                ? `${latestCompliance.issuesCount} items in the latest review`
                : 'Run the first compliance pass'
            }
          />
          <MetricCard
            label='Last updated'
            value={new Date(draft.updatedAt).toLocaleDateString()}
            detail={new Date(draft.updatedAt).toLocaleTimeString()}
          />
        </div>
      </section>

      {/* Compliance Summary */}
      {showCompliance && complianceResult ? (
        <ComplianceSummary
          complianceResult={complianceResult}
          isCheckingCompliance={isCheckingCompliance}
          onRefresh={handleCheckCompliance}
          onDismiss={() => setShowCompliance(false)}
        />
      ) : null}

      {/* Main Content Grid */}
      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]'>
        <div className='space-y-6'>
          <DraftStudio
            content={content}
            wordCount={wordCount}
            sectionOutline={sectionOutline}
            selectedSectionId={selectedSectionId}
            onContentChange={handleContentChange}
            onSectionSelect={setSelectedSectionId}
            onAddSection={handleAddSection}
            readOnly={isReadOnly}
          />

          <SectionEditor
            selectedSection={selectedSection}
            selectedSectionNumber={selectedSectionNumber}
            totalSections={sectionOutline.length}
            jurisdiction={draft.jurisdiction}
            documentType={draft.documentType}
            onSectionChange={handleSectionChange}
            onRemoveSection={handleRemoveSection}
            readOnly={isReadOnly}
          />
        </div>

        <div className='space-y-6'>
          <WorkflowPanel draft={draft} status={status} onStatusChange={setStatus} readOnly={isReadOnly} />

          {['ORDINANCE', 'RESOLUTION'].includes(draft.documentType.toUpperCase()) ? (
            <LegislativeTrackerPanel
              jurisdiction={draft.jurisdiction}
              documentType={draft.documentType}
              milestones={milestones}
              currentUserRole={draft.effectiveRole ?? undefined}
              onUpdateMilestones={setMilestones}
              readOnly={isReadOnly}
            />
          ) : null}

          <CompliancePulsePanel
            latestCompliance={latestCompliance}
            complianceHistory={complianceHistory ?? undefined}
          />

          <VersionTrailPanel
            versionHistory={versionHistory ?? undefined}
            isRestoringVersionId={isRestoringVersionId}
            onRestoreVersion={handleRestoreVersion}
            readOnly={isReadOnly}
          />
        </div>
      </div>

      {/* Official Philippine Government Document Export Modal */}
      <OfficialExportModal
        isOpen={isOfficialExportOpen}
        onClose={() => setIsOfficialExportOpen(false)}
        draft={draft}
        content={content}
        milestones={milestones}
      />
    </div>
  );
}
