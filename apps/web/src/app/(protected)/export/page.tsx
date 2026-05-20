'use client';

import { cn, extractDraftBody, extractDraftSections } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { CheckCircle, ChevronRight, Download, FileText, FileType, Loader2, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-hooks';

type ExportFormat = 'txt' | 'md' | 'docx' | 'pdf';

const exportFormats: Array<{
  id: ExportFormat;
  name: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Export as a .txt file',
    icon: FileText,
  },
  {
    id: 'md',
    name: 'Markdown',
    description: 'Export as a .md document',
    icon: FileType,
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Export as a .docx file',
    icon: ScrollText,
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Export as a paginated .pdf file',
    icon: FileText,
  },
];

interface Draft {
  id: string;
  title: string;
  documentType: string;
  jurisdiction: string;
  jurisdictionName: string;
  status: string;
  version: number;
  content: unknown;
  updatedAt: string;
}

interface DraftVersion {
  id: string;
  title: string;
  status: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  commitMessage?: string;
  isCurrent: boolean;
  body: string;
}

interface ExportSection {
  heading: string;
  body: string;
}

function getDraftContent(draft: Draft): string {
  return extractDraftBody(draft.content);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]/gi, '_');
}

function buildTextExportContent(draft: Draft, version: DraftVersion, format: 'txt' | 'md') {
  const sections = extractDraftSections({ body: version.body });
  const structuredContent =
    sections.length > 0
      ? sections.map((section) => `${section.heading}\n${section.body}`.trim()).join('\n\n')
      : version.body;

  if (format === 'md') {
    const markdownSections =
      sections.length > 0
        ? sections.map((section) => `## ${section.heading}\n\n${section.body || 'No content'}`).join('\n\n')
        : version.body;
    return `# ${draft.title}\n\n**Type:** ${draft.documentType}\n**Jurisdiction:** ${draft.jurisdictionName}\n**Version:** ${version.version}\n**Status:** ${version.status}\n\n---\n\n${markdownSections}`;
  }

  return `${draft.documentType.toUpperCase()}\n${draft.title}\n${draft.jurisdictionName} (${draft.jurisdiction.toUpperCase()})\nVersion: ${version.version}\nStatus: ${version.status}\n${'='.repeat(50)}\n\n${structuredContent}`;
}

async function buildDocxBlob(draft: Draft, version: DraftVersion) {
  const sections = extractDraftSections({ body: version.body });
  const bodyParagraphs = buildDocxSectionParagraphs(sections);

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({ text: draft.documentType, bold: true, size: 30 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: draft.title, bold: true, size: 34 })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: `Jurisdiction: ${draft.jurisdictionName} (${draft.jurisdiction})`, bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: `Version: v${version.version}`, bold: true })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: `Status: ${version.status}`, bold: true })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: `Last Updated: ${new Date(version.updatedAt).toLocaleString()}` })],
          }),
          ...(version.commitMessage
            ? [
                new Paragraph({
                  spacing: { after: 240 },
                  children: [new TextRun({ text: `Revision Note: ${version.commitMessage}` })],
                }),
              ]
            : []),
          ...bodyParagraphs,
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

async function buildPdfBlob(draft: Draft, version: DraftVersion) {
  const sections = extractDraftSections({ body: version.body });
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 56;
  const topMargin = 64;
  const bottomMargin = 56;
  const maxWidth = pageWidth - marginX * 2;
  let y = topMargin;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - bottomMargin) {
      return;
    }

    pdf.addPage();
    y = topMargin;
  };

  const drawWrappedText = (
    text: string,
    fontSize: number,
    lineHeight: number,
    options?: { align?: 'left' | 'center' | 'right'; bold?: boolean },
  ) => {
    pdf.setFont('times', options?.bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text || ' ', maxWidth);

    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, options?.align === 'center' ? pageWidth / 2 : marginX, y, {
        align: options?.align ?? 'left',
        maxWidth,
      });
      y += lineHeight;
    }
  };

  drawWrappedText(draft.documentType, 16, 20, { align: 'center', bold: true });
  y += 8;
  drawWrappedText(draft.title, 18, 24, { align: 'center', bold: true });
  y += 18;
  drawWrappedText(`Jurisdiction: ${draft.jurisdictionName} (${draft.jurisdiction})`, 11, 16, { bold: true });
  drawWrappedText(`Version: v${version.version}`, 11, 16, { bold: true });
  drawWrappedText(`Status: ${version.status}`, 11, 16, { bold: true });
  drawWrappedText(`Last Updated: ${new Date(version.updatedAt).toLocaleString()}`, 11, 16);

  if (version.commitMessage) {
    drawWrappedText(`Revision Note: ${version.commitMessage}`, 11, 16);
  }

  y += 10;
  pdf.setDrawColor(180, 180, 180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  const exportSections =
    sections.length > 0
      ? sections
      : [{ heading: 'Body', body: version.body || 'No content available for this version.' }];

  for (const section of exportSections) {
    drawWrappedText(section.heading, 13, 18, { bold: true });
    if (section.body.trim()) {
      for (const line of section.body.split('\n')) {
        drawWrappedText(line || ' ', 12, 18);
      }
    } else {
      drawWrappedText('No content', 12, 18);
    }
    y += 10;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    pdf.setPage(pageIndex);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Page ${pageIndex} of ${pageCount}`, pageWidth - marginX, pageHeight - 24, {
      align: 'right',
    });
  }

  return pdf.output('blob');
}

function buildDocxSectionParagraphs(sections: ExportSection[]) {
  const exportSections =
    sections.length > 0 ? sections : [{ heading: 'Body', body: 'No content available for this version.' }];

  return exportSections.flatMap((section) => {
    const sectionBody = section.body.trim()
      ? section.body.split('\n').map(
          (line, index) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: index === section.body.split('\n').length - 1 ? 180 : 80 },
              children: [new TextRun({ text: line || ' ' })],
            }),
        )
      : [
          new Paragraph({
            spacing: { after: 180 },
            children: [new TextRun({ text: 'No content available for this section.' })],
          }),
        ];

    return [
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: section.heading, bold: true, size: 26 })],
      }),
      ...sectionBody,
    ];
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function ExportPageContent() {
  const searchParams = useSearchParams();
  const initialDraftId = searchParams.get('draft');

  const { data: drafts, isLoading } = useApiQuery<Draft[]>('/drafts');

  const [selectedDraftId, setSelectedDraftId] = useState<string>(initialDraftId || '');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const { data: versionHistory } = useApiQuery<DraftVersion[]>(
    selectedDraftId ? `/drafts/${selectedDraftId}/versions` : null,
  );

  const selectedDraft = drafts?.find((draft: Draft) => draft.id === selectedDraftId);
  const fallbackVersion: DraftVersion | undefined = selectedDraft
    ? {
        id: selectedDraft.id,
        title: selectedDraft.title,
        status: selectedDraft.status,
        version: selectedDraft.version,
        updatedAt: selectedDraft.updatedAt,
        createdAt: selectedDraft.updatedAt,
        commitMessage: undefined,
        isCurrent: true,
        body: getDraftContent(selectedDraft),
      }
    : undefined;

  const currentVersion = versionHistory?.find((version) => version.isCurrent) ?? fallbackVersion;
  const resolvedVersionId =
    selectedVersionId && versionHistory?.some((version) => version.id === selectedVersionId)
      ? selectedVersionId
      : (currentVersion?.id ?? '');
  const selectedVersion = versionHistory?.find((version) => version.id === resolvedVersionId) ?? fallbackVersion;

  const handleExport = async () => {
    if (!selectedDraft || !selectedVersion) {
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (selectedFormat === 'docx') {
        const blob = await buildDocxBlob(selectedDraft, selectedVersion);
        const filename = `${sanitizeFilename(selectedDraft.title)}_v${selectedVersion.version}.docx`;
        downloadBlob(blob, filename);

        await api.post(`/drafts/${selectedDraft.id}/export`, { format: 'docx', fileSize: blob.size });
        toast.success(`Exported ${filename}`);
      } else if (selectedFormat === 'pdf') {
        const blob = await buildPdfBlob(selectedDraft, selectedVersion);
        const filename = `${sanitizeFilename(selectedDraft.title)}_v${selectedVersion.version}.pdf`;
        downloadBlob(blob, filename);

        await api.post(`/drafts/${selectedDraft.id}/export`, { format: 'pdf', fileSize: blob.size });
        toast.success(`Exported ${filename}`);
      } else {
        const result = await api.get<{ content: string; filename: string; mimeType: string }>(
          `/drafts/${selectedDraft.id}/export?format=${selectedFormat}`,
        );

        const blob = new Blob([result.content], { type: result.mimeType });
        downloadBlob(blob, result.filename);
        toast.success(`Exported ${result.filename}`);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export draft. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    if (!selectedDraft || !selectedVersion) {
      return;
    }

    const previewFormat = selectedFormat === 'docx' || selectedFormat === 'pdf' ? 'md' : selectedFormat;
    setPreviewContent(buildTextExportContent(selectedDraft, selectedVersion, previewFormat));
    setShowPreview(true);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Export</h1>
        <p className='text-muted-foreground'>
          Export current drafts and saved revisions as text, Markdown, DOCX, or PDF.
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Select Draft</CardTitle>
              <CardDescription>Choose a draft to export</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-10' />
                  <Skeleton className='h-10' />
                </div>
              ) : !drafts || drafts.length === 0 ? (
                <div className='text-center py-4'>
                  <FileText className='h-8 w-8 mx-auto text-muted mb-2' />
                  <p className='text-sm text-muted-foreground'>No drafts found</p>
                </div>
              ) : (
                <Select
                  value={selectedDraftId}
                  onValueChange={(value) => {
                    setSelectedDraftId(value);
                    setSelectedVersionId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a draft' />
                  </SelectTrigger>
                  <SelectContent>
                    {drafts.map((draft: Draft) => (
                      <SelectItem key={draft.id} value={draft.id}>
                        <div className='truncate'>
                          <div className='font-medium truncate'>{draft.title}</div>
                          <div className='text-xs text-muted-foreground'>
                            v{draft.version} • {new Date(draft.updatedAt).toLocaleDateString()}
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
                <div className='font-medium'>{selectedDraft.title}</div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Type</span>
                  <Badge variant='outline'>{selectedDraft.documentType}</Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Jurisdiction</span>
                  <span className='capitalize'>{selectedDraft.jurisdiction}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Current Version</span>
                  <span>v{selectedDraft.version}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Status</span>
                  <Badge variant='secondary'>{selectedDraft.status}</Badge>
                </div>
                <div className='pt-2'>
                  <Button variant='outline' size='sm' className='w-full' asChild>
                    <Link href={`/drafts/${selectedDraft.id}`}>
                      View Draft
                      <ChevronRight className='ml-1 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedDraft && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Select Version</CardTitle>
                <CardDescription>Export the current draft or a saved revision.</CardDescription>
              </CardHeader>
              <CardContent>
                {versionHistory === undefined ? (
                  <Skeleton className='h-10' />
                ) : (
                  <Select value={resolvedVersionId} onValueChange={setSelectedVersionId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a version' />
                    </SelectTrigger>
                    <SelectContent>
                      {versionHistory.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} {version.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedVersion && (
                  <div className='mt-4 space-y-2 rounded-lg border p-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Exporting</span>
                      <span>v{selectedVersion.version}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Updated</span>
                      <span>{new Date(selectedVersion.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {selectedVersion.commitMessage && (
                      <div className='text-muted-foreground'>{selectedVersion.commitMessage}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>Choose the format for your export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-3'>
                {exportFormats.map((format) => (
                  <button
                    key={format.id}
                    type='button'
                    className={cn(
                      'rounded-lg border-2 p-4 text-left transition-all',
                      selectedFormat === format.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50',
                    )}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={cn('rounded-lg p-2', selectedFormat === format.id ? 'bg-primary/10' : 'bg-muted')}
                      >
                        <format.icon
                          className={cn(
                            'h-5 w-5',
                            selectedFormat === format.id ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                      </div>
                      <div>
                        <div className='font-medium'>{format.name}</div>
                        <div className='text-xs text-muted-foreground'>{format.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {selectedDraft && selectedVersion ? (
                <>
                  <div className='flex items-center justify-between rounded-lg bg-muted/50 p-4'>
                    <div className='flex items-center gap-3'>
                      <FileText className='h-8 w-8 text-muted-foreground' />
                      <div>
                        <div className='font-medium'>
                          {sanitizeFilename(selectedDraft.title)}_v{selectedVersion.version}.{selectedFormat}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          v{selectedVersion.version} • {selectedVersion.body.length} characters
                        </div>
                      </div>
                    </div>
                    {exportSuccess && (
                      <Badge className='bg-green-100 text-green-800'>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Exported
                      </Badge>
                    )}
                  </div>

                  <div className='flex gap-2'>
                    <Button variant='outline' onClick={handlePreview}>
                      <FileText className='mr-2 h-4 w-4' />
                      Preview
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting} className='flex-1'>
                      {isExporting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className='mr-2 h-4 w-4' />
                          Export {selectedFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className='py-8 text-center text-muted-foreground'>Select a draft and version to export</div>
              )}
            </CardContent>
          </Card>

          {showPreview && (
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle>Export Preview</CardTitle>
                  <CardDescription>
                    {selectedFormat === 'docx'
                      ? 'DOCX preview uses the same structured content that will be written into the Word document.'
                      : selectedFormat === 'pdf'
                        ? 'PDF preview uses the same structured content and metadata that will be laid out in the final document.'
                        : 'Text preview for the selected export format.'}
                  </CardDescription>
                </div>
                <Button variant='ghost' size='sm' onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <div className='max-h-[400px] overflow-y-auto rounded-lg bg-muted p-4 font-mono text-sm whitespace-pre-wrap'>
                  {previewContent}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportLoading() {
  return (
    <div className='space-y-6'>
      <div>
        <Skeleton className='mb-2 h-10 w-64' />
        <Skeleton className='h-5 w-96' />
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='space-y-6'>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-40' />
            </CardContent>
          </Card>
        </div>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-40' />
            </CardContent>
          </Card>
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

export default function ExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <ExportPageContent />
    </Suspense>
  );
}
