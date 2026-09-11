'use client';

import { cn, extractDraftBody, extractDraftSections } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import {
  CheckCircle,
  ChevronRight,
  Download,
  FileText,
  FileType,
  Loader2,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-hooks';
import type { ApiDraft, ApiDraftVersion, PaginatedResponse } from '@/types';

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

interface ExportSection {
  heading: string;
  body: string;
}

function getDraftContent(draft: ApiDraft): string {
  return extractDraftBody(draft.content);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]/gi, '_');
}

function buildTextExportContent(draft: ApiDraft, version: ApiDraftVersion, format: 'txt' | 'md') {
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

function getSanggunianBodyName(jurisdiction: string) {
  switch (jurisdiction.toLowerCase()) {
    case 'barangay':
      return 'SANGGUNIANG BARANGAY';
    case 'municipal':
      return 'SANGGUNIANG BAYAN';
    case 'provincial':
      return 'SANGGUNIANG PANLALAWIGAN';
    default:
      return 'SANGGUNIANG PANLUNGSOD';
  }
}

function getLocalChiefExecutiveTitle(jurisdiction: string) {
  switch (jurisdiction.toLowerCase()) {
    case 'barangay':
      return 'Punong Barangay';
    case 'municipal':
      return 'Municipal Mayor';
    case 'provincial':
      return 'Provincial Governor';
    default:
      return 'City Mayor';
  }
}

function getPresidingOfficerTitle(jurisdiction: string) {
  switch (jurisdiction.toLowerCase()) {
    case 'barangay':
      return 'Punong Barangay / Presiding Officer';
    case 'municipal':
      return 'Municipal Vice Mayor / Presiding Officer';
    case 'provincial':
      return 'Vice Governor / Presiding Officer';
    default:
      return 'City Vice Mayor / Presiding Officer';
  }
}

async function buildDocxBlob(draft: ApiDraft, version: ApiDraftVersion) {
  const sections = extractDraftSections({ body: version.body });
  const bodyParagraphs = buildDocxSectionParagraphs(sections);
  const sanggunianName = getSanggunianBodyName(draft.jurisdiction);
  const lceTitle = getLocalChiefExecutiveTitle(draft.jurisdiction);
  const presidingTitle = getPresidingOfficerTitle(draft.jurisdiction);

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: 'REPUBLIC OF THE PHILIPPINES', bold: true, size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: draft.jurisdictionName.toUpperCase(), bold: true, size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: `OFFICE OF THE ${sanggunianName}`, bold: true, size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: `${draft.documentType.toUpperCase()} NO. 2025-___`, bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [new TextRun({ text: draft.title, bold: true, size: 30 })],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `Jurisdiction Level: ${draft.jurisdiction.toUpperCase()} | Version: v${version.version} | Status: ${version.status}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Date Generated: ${new Date(version.updatedAt).toLocaleDateString()}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
          ...(version.commitMessage
            ? [
                new Paragraph({
                  spacing: { after: 240 },
                  children: [
                    new TextRun({ text: `Revision Notes: ${version.commitMessage}`, italics: true, size: 18 }),
                  ],
                }),
              ]
            : []),
          ...bodyParagraphs,
          new Paragraph({
            spacing: { before: 400, after: 140 },
            children: [new TextRun({ text: 'ATTESTATION & APPROVAL', bold: true, size: 24 })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'I HEREBY CERTIFY to the correctness of the foregoing measure enacted by the Sanggunian.',
                italics: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 240, after: 40 },
            children: [new TextRun({ text: '____________________________________', bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: 'Secretary to the Sanggunian', bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { before: 180, after: 40 },
            children: [new TextRun({ text: 'ATTESTED & CERTIFIED CORRECT:', size: 20, bold: true })],
          }),
          new Paragraph({
            spacing: { before: 240, after: 40 },
            children: [new TextRun({ text: 'HON. _______________________________', bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: presidingTitle, bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { before: 200, after: 40 },
            children: [
              new TextRun({ text: `APPROVED pursuant to Section 54, Republic Act No. 7160:`, size: 20, bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { before: 240, after: 40 },
            children: [new TextRun({ text: 'HON. _______________________________', bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: lceTitle, bold: true, size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: 'Date: ________________________', size: 18 })],
          }),
          new Paragraph({
            spacing: { before: 240, after: 40 },
            children: [
              new TextRun({
                text: 'WORKING DRAFT — NOT AN OFFICIAL RECORD',
                bold: true,
                size: 16,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'This export has not been authenticated or legally certified by LexiGov.',
                italics: true,
                size: 16,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

async function buildPdfBlob(draft: ApiDraft, version: ApiDraftVersion) {
  const sections = extractDraftSections({ body: version.body });
  const sanggunianName = getSanggunianBodyName(draft.jurisdiction);
  const lceTitle = getLocalChiefExecutiveTitle(draft.jurisdiction);
  const presidingTitle = getPresidingOfficerTitle(draft.jurisdiction);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 56;
  const topMargin = 56;
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
    options?: { align?: 'left' | 'center' | 'right'; bold?: boolean; italic?: boolean },
  ) => {
    const style = options?.bold ? 'bold' : options?.italic ? 'italic' : 'normal';
    pdf.setFont('times', style);
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

  // Official Philippine LGU Header
  drawWrappedText('REPUBLIC OF THE PHILIPPINES', 12, 16, { align: 'center', bold: true });
  drawWrappedText(draft.jurisdictionName.toUpperCase(), 13, 17, { align: 'center', bold: true });
  drawWrappedText(`OFFICE OF THE ${sanggunianName}`, 12, 16, { align: 'center', bold: true });
  y += 12;

  pdf.setDrawColor(120, 120, 120);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 16;

  drawWrappedText(`${draft.documentType.toUpperCase()} NO. 2025-___`, 14, 18, { align: 'center', bold: true });
  y += 4;
  drawWrappedText(draft.title, 16, 22, { align: 'center', bold: true });
  y += 12;

  drawWrappedText(
    `Jurisdiction: ${draft.jurisdictionName} (${draft.jurisdiction.toUpperCase()}) | Version: v${version.version} | Status: ${version.status}`,
    10,
    14,
    { italic: true },
  );
  drawWrappedText(`Date: ${new Date(version.updatedAt).toLocaleDateString()}`, 10, 14, { italic: true });

  if (version.commitMessage) {
    drawWrappedText(`Revision Note: ${version.commitMessage}`, 10, 14, { italic: true });
  }

  y += 10;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  const exportSections =
    sections.length > 0
      ? sections
      : [{ heading: 'Body', body: version.body || 'No content available for this version.' }];

  for (const section of exportSections) {
    drawWrappedText(section.heading, 12, 17, { bold: true });
    if (section.body.trim()) {
      for (const line of section.body.split('\n')) {
        drawWrappedText(line || ' ', 11, 16);
      }
    } else {
      drawWrappedText('No content', 11, 16);
    }
    y += 10;
  }

  // Signatory & Approval Section
  y += 16;
  ensureSpace(240);
  drawWrappedText('ATTESTATION & APPROVAL', 12, 16, { bold: true });
  drawWrappedText('I HEREBY CERTIFY to the correctness of the foregoing legislative measure.', 10, 14, {
    italic: true,
  });
  y += 24;

  drawWrappedText('____________________________________', 10, 14);
  drawWrappedText('Secretary to the Sanggunian', 10, 14, { bold: true });
  y += 18;

  drawWrappedText('ATTESTED & CERTIFIED CORRECT:', 10, 14, { bold: true });
  y += 24;
  drawWrappedText('HON. _______________________________', 10, 14);
  drawWrappedText(presidingTitle, 10, 14, { bold: true });
  y += 18;

  drawWrappedText('APPROVED pursuant to Section 54, Republic Act No. 7160:', 10, 14, { bold: true });
  y += 24;
  drawWrappedText('HON. _______________________________', 10, 14);
  drawWrappedText(lceTitle, 10, 14, { bold: true });
  drawWrappedText('Date: ________________________', 10, 14);

  const pageCount = pdf.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    pdf.setPage(pageIndex);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    pdf.text(
      `Page ${pageIndex} of ${pageCount} | WORKING DRAFT - NOT AN OFFICIAL RECORD`,
      pageWidth - marginX,
      pageHeight - 24,
      { align: 'right' },
    );
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
        children: [new TextRun({ text: section.heading, bold: true, size: 24 })],
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

export function ExportPageContent() {
  const searchParams = useSearchParams();
  const initialDraftId = searchParams.get('draft');

  const { data: draftsPage, isLoading } = useApiQuery<PaginatedResponse<ApiDraft>>('/drafts');
  const drafts = draftsPage?.data;

  const [selectedDraftId, setSelectedDraftId] = useState<string>(initialDraftId || '');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const { data: versionHistory } = useApiQuery<ApiDraftVersion[]>(
    selectedDraftId ? `/drafts/${selectedDraftId}/versions` : null,
  );

  const selectedDraft = drafts?.find((draft: ApiDraft) => draft.id === selectedDraftId);
  const fallbackVersion: ApiDraftVersion | undefined = selectedDraft
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

  const currentVersion = versionHistory?.find((version: ApiDraftVersion) => version.isCurrent) ?? fallbackVersion;
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
        const content = buildTextExportContent(selectedDraft, selectedVersion, selectedFormat);
        const mimeType = selectedFormat === 'md' ? 'text/markdown' : 'text/plain';
        const filename = `${sanitizeFilename(selectedDraft.title)}_v${selectedVersion.version}.${selectedFormat}`;
        const blob = new Blob([content], { type: mimeType });
        downloadBlob(blob, filename);

        await api.post(`/drafts/${selectedDraft.id}/export`, { format: selectedFormat, fileSize: blob.size });
        toast.success(`Exported ${filename}`);
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
                    {drafts.map((draft: ApiDraft) => (
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
                      {(versionHistory ?? []).map((version) => (
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

          {selectedDraft && selectedVersion && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-semibold flex items-center gap-1.5'>
                  <ShieldAlert className='h-4 w-4 text-amber-600' />
                  Unverified working draft
                </CardTitle>
              </CardHeader>
              <CardContent className='text-xs text-muted-foreground'>
                Exports do not certify enactment, signatures, or legal compliance. Obtain the official record from the issuing LGU.
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

export function ExportLoading() {
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
