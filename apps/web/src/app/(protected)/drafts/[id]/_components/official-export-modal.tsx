'use client';

import {
  buildDefaultDocumentFormatConfig,
  type DocumentFormatConfig,
  type FontFamily,
  type FormattedDocumentData,
  inferSanggunianBodyName,
  type LegislativeMilestones,
  type LineSpacing,
  type PaperSize,
  toJurisdictionLevel,
} from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@lexigov/ui/components/dialog';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { ScrollArea } from '@lexigov/ui/components/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Check, Copy, Download, FileText, Landmark, Loader2, Printer, ScrollText, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  downloadOfficialDocx,
  downloadOfficialPdf,
  printOfficialDocument,
} from '@/lib/export/official-document-export';
import type { Draft } from './types';

type OfficialExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  draft: Draft;
  content: string;
  milestones?: LegislativeMilestones;
};

export function OfficialExportModal({ isOpen, onClose, draft, content, milestones }: OfficialExportModalProps) {
  const [activeTab, setActiveTab] = useState<'format' | 'session' | 'signatories'>('format');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<DocumentFormatConfig>(() =>
    buildDefaultDocumentFormatConfig(toJurisdictionLevel(draft.jurisdiction), draft.jurisdictionName, milestones),
  );

  const documentData: FormattedDocumentData = {
    title: draft.title,
    enactmentNumber: milestones?.enactmentNo || '____-___',
    documentType: draft.documentType,
    jurisdiction: toJurisdictionLevel(draft.jurisdiction),
    jurisdictionName: draft.jurisdictionName,
    body: content,
    version: draft.version,
  };

  const { officeName, legislativeBody } = inferSanggunianBodyName(
    documentData.jurisdiction,
    documentData.jurisdictionName,
  );

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await downloadOfficialDocx(documentData, config);
      toast.success('Word (.docx) working draft downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Word document.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      downloadOfficialPdf(documentData, config);
      toast.success('PDF working draft downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF document.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    printOfficialDocument(documentData, config);
  };

  const handleCopyText = async () => {
    const { generateOfficialDocumentText } = await import('@lexigov/shared');
    const text = generateOfficialDocumentText(documentData, config);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Formatted working draft copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const fontCssFamily =
    config.fontFamily === 'Book Antiqua'
      ? '"Book Antiqua", "Palatino Linotype", Palatino, serif'
      : config.fontFamily === 'Times New Roman'
        ? '"Times New Roman", Times, serif'
        : 'Arial, sans-serif';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden'>
        <DialogHeader className='px-6 py-4 border-b bg-muted/20'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <Landmark className='h-5 w-5 text-primary' />
              <div>
                <DialogTitle className='text-lg font-semibold'>Government Document Draft Exporter</DialogTitle>
                <DialogDescription className='text-xs'>
                  Export a working draft for authorized review. This does not certify enactment, authenticity, or legal
                  compliance.
                </DialogDescription>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs font-mono'>
                WORKING DRAFT
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className='grid flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] overflow-hidden divide-y lg:divide-y-0 lg:divide-x'>
          {/* Left Panel: Customizer Controls */}
          <div className='flex flex-col h-full bg-card overflow-hidden'>
            {/* Customizer Tabs */}
            <div className='grid grid-cols-3 border-b text-xs font-medium text-center bg-muted/30'>
              <button
                type='button'
                onClick={() => setActiveTab('format')}
                className={`py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'format'
                    ? 'border-primary text-primary font-semibold bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className='h-3.5 w-3.5' /> Format
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('session')}
                className={`py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'session'
                    ? 'border-primary text-primary font-semibold bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className='h-3.5 w-3.5' /> Session
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('signatories')}
                className={`py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'signatories'
                    ? 'border-primary text-primary font-semibold bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className='h-3.5 w-3.5' /> Signatories
              </button>
            </div>

            <ScrollArea className='flex-1 p-4'>
              {activeTab === 'format' ? (
                <div className='space-y-4 text-xs'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Paper Standard</Label>
                    <Select
                      value={config.paperSize}
                      onValueChange={(val) => setConfig((prev) => ({ ...prev, paperSize: val as PaperSize }))}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='A4' className='text-xs'>
                          A4 (210 × 297 mm)
                        </SelectItem>
                        <SelectItem value='LEGAL' className='text-xs'>
                          Legal / Long Bond (8.5 × 13 in)
                        </SelectItem>
                        <SelectItem value='LETTER' className='text-xs'>
                          Letter / Short Bond (8.5 × 11 in)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Document Font</Label>
                    <Select
                      value={config.fontFamily}
                      onValueChange={(val) => setConfig((prev) => ({ ...prev, fontFamily: val as FontFamily }))}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Book Antiqua' className='text-xs'>
                          Book Antiqua (Serif)
                        </SelectItem>
                        <SelectItem value='Times New Roman' className='text-xs'>
                          Times New Roman (Serif)
                        </SelectItem>
                        <SelectItem value='Arial' className='text-xs'>
                          Arial (Modern Clean Sans)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Font Size (pt)</Label>
                      <Input
                        type='number'
                        className='h-8 text-xs'
                        value={config.fontSizePt}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, fontSizePt: parseInt(e.target.value, 10) || 11 }))
                        }
                        min={9}
                        max={14}
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Line Spacing</Label>
                      <Select
                        value={config.lineSpacing.toString()}
                        onValueChange={(val) =>
                          setConfig((prev) => ({ ...prev, lineSpacing: parseFloat(val) as LineSpacing }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1.15' className='text-xs'>
                            1.15 (Standard)
                          </SelectItem>
                          <SelectItem value='1.5' className='text-xs'>
                            1.5 (Plenary Reading)
                          </SelectItem>
                          <SelectItem value='2' className='text-xs'>
                            2.0 (Double Spaced)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='pt-2 border-t space-y-2'>
                    <Label className='text-xs font-semibold'>Toggle Statutory Sections</Label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-primary focus:ring-primary'
                        checked={config.includeSeals}
                        onChange={(e) => setConfig((prev) => ({ ...prev, includeSeals: e.target.checked }))}
                      />
                      <span>Include Republic & LGU Header</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-primary focus:ring-primary'
                        checked={config.includeSessionExcerpt}
                        onChange={(e) => setConfig((prev) => ({ ...prev, includeSessionExcerpt: e.target.checked }))}
                      />
                      <span>Include unverified draft session details</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-primary focus:ring-primary'
                        checked={config.includeSignatures}
                        onChange={(e) => setConfig((prev) => ({ ...prev, includeSignatures: e.target.checked }))}
                      />
                      <span>Include proposed signatory placeholders</span>
                    </label>
                    <p className='text-muted-foreground'>
                      Placeholders do not record a signature, adoption, or approval.
                    </p>
                  </div>
                </div>
              ) : null}

              {activeTab === 'session' ? (
                <div className='space-y-3 text-xs'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Session Type</Label>
                    <Select
                      value={config.sessionDetails?.sessionType || 'REGULAR'}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          sessionDetails: prev.sessionDetails
                            ? {
                                ...prev.sessionDetails,
                                sessionType: val as 'REGULAR' | 'SPECIAL',
                              }
                            : undefined,
                        }))
                      }
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='REGULAR' className='text-xs'>
                          Regular Session
                        </SelectItem>
                        <SelectItem value='SPECIAL' className='text-xs'>
                          Special Session
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Session Date</Label>
                    <Input
                      type='date'
                      className='h-8 text-xs'
                      value={config.sessionDetails?.sessionDate || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          sessionDetails: prev.sessionDetails
                            ? { ...prev.sessionDetails, sessionDate: e.target.value }
                            : undefined,
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Session Venue</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.sessionDetails?.sessionVenue || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          sessionDetails: prev.sessionDetails
                            ? { ...prev.sessionDetails, sessionVenue: e.target.value }
                            : undefined,
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Present Members (comma separated)</Label>
                    <textarea
                      rows={4}
                      className='w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      value={config.sessionDetails?.presentMembers.join('\n') || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          sessionDetails: prev.sessionDetails
                            ? {
                                ...prev.sessionDetails,
                                presentMembers: e.target.value.split('\n').filter(Boolean),
                              }
                            : undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {activeTab === 'signatories' ? (
                <div className='space-y-3 text-xs'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Sanggunian Secretary Name</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.secretaryName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, secretaryName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Secretary Official Title</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.secretaryTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, secretaryTitle: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-1.5 pt-2 border-t'>
                    <Label className='text-xs'>Presiding Officer (Vice Mayor / Vice Gov)</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.presidingOfficerName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, presidingOfficerName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Presiding Officer Title</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.presidingOfficerTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, presidingOfficerTitle: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-1.5 pt-2 border-t'>
                    <Label className='text-xs'>Local Chief Executive (Mayor / Governor)</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.chiefExecutiveName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, chiefExecutiveName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Chief Executive Title</Label>
                    <Input
                      className='h-8 text-xs'
                      value={config.signatories.chiefExecutiveTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signatories: { ...prev.signatories, chiefExecutiveTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </ScrollArea>
          </div>

          {/* Right Panel: Live Virtual Sheet Preview */}
          <div className='flex flex-col h-full bg-muted/40 overflow-hidden'>
            <div className='p-2 bg-muted/60 border-b flex items-center justify-between text-xs text-muted-foreground'>
              <span>
                Sheet Preview ({config.paperSize} • {config.fontFamily})
              </span>
              <span className='font-mono text-[11px]'>100% Scaled</span>
            </div>

            <ScrollArea className='flex-1 p-6'>
              <div
                className='mx-auto bg-white text-black p-8 shadow-md rounded-sm border border-gray-300 text-xs leading-relaxed max-w-[650px]'
                style={{
                  fontFamily: fontCssFamily,
                  fontSize: `${config.fontSizePt}pt`,
                  lineHeight: config.lineSpacing,
                }}
              >
                {/* Official Letterhead Header */}
                {config.includeSeals ? (
                  <div className='text-center pb-3 border-b-2 border-black mb-4'>
                    <div className='text-[10pt] font-bold tracking-wider'>REPUBLIC OF THE PHILIPPINES</div>
                    <div className='text-[12pt] font-bold'>{documentData.jurisdictionName.toUpperCase()}</div>
                    <div className='text-[9pt] font-semibold'>{officeName}</div>
                  </div>
                ) : null}

                {/* Unverified draft session details */}
                {config.includeSessionExcerpt && config.sessionDetails ? (
                  <div className='text-[8.5pt] italic border-b border-dashed border-gray-400 pb-3 mb-4 space-y-1'>
                    <p className='font-bold'>DRAFT SESSION DETAILS — NOT VERIFIED AGAINST OFFICIAL MINUTES</p>
                    <p>
                      {config.sessionDetails.sessionType} SESSION OF THE {legislativeBody}; VENUE:{' '}
                      {config.sessionDetails.sessionVenue.toUpperCase() || 'NOT PROVIDED'}; DATE:{' '}
                      {config.sessionDetails.sessionDate || 'NOT PROVIDED'}.
                    </p>
                    <p>
                      <strong>PRESENT:</strong> {config.sessionDetails.presentMembers.join(', ')}
                    </p>
                    {config.sessionDetails.absentMembers.length > 0 ? (
                      <p>
                        <strong>ABSENT:</strong> {config.sessionDetails.absentMembers.join(', ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Ordinance Number & Title */}
                <div className='text-center my-4'>
                  <div className='font-bold text-[11pt]'>
                    {documentData.enactmentNumber
                      ? `${documentData.documentType.toUpperCase()} NO. ${documentData.enactmentNumber}`
                      : `${documentData.documentType.toUpperCase()} NO. ____-___`}
                  </div>
                  <div className='font-bold text-[10pt] mt-1 uppercase'>{documentData.title}</div>
                </div>

                {/* Ordinance Body Content */}
                <div className='text-justify whitespace-pre-wrap my-4 space-y-3 font-normal'>{documentData.body}</div>

                {/* Proposed signatory placeholders */}
                {config.includeSignatures ? (
                  <div className='pt-6 mt-6 border-t border-gray-300 space-y-5 text-[9pt]'>
                    <div>
                      <p className='font-bold'>DRAFT SIGNATORY PLACEHOLDERS — NO SIGNATURE OR APPROVAL IS RECORDED</p>
                      <p>Proposed Sanggunian Secretary:</p>
                      <div className='text-right mt-3'>
                        <div className='font-bold uppercase'>{config.signatories.secretaryName}</div>
                        <div className='text-gray-700'>{config.signatories.secretaryTitle}</div>
                      </div>
                    </div>

                    <div>
                      <p className='font-bold'>PROPOSED PRESIDING OFFICER:</p>
                      <div className='text-right mt-3'>
                        <div className='font-bold uppercase'>{config.signatories.presidingOfficerName}</div>
                        <div className='text-gray-700'>{config.signatories.presidingOfficerTitle}</div>
                      </div>
                    </div>

                    <div>
                      <p className='font-bold'>PROPOSED LOCAL CHIEF EXECUTIVE:</p>
                      <div className='text-right mt-3'>
                        <div className='font-bold uppercase'>{config.signatories.chiefExecutiveName}</div>
                        <div className='text-gray-700'>{config.signatories.chiefExecutiveTitle}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className='mt-8 pt-3 border-t border-gray-300 text-[7.5pt] text-gray-500'>
                  WORKING DRAFT — NOT AN OFFICIAL RECORD. Not authenticated or legally certified by LexiGov.
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Action Bar */}
        <div className='px-6 py-3 border-t bg-card flex items-center justify-between'>
          <Button variant='outline' size='sm' onClick={handleCopyText} className='text-xs'>
            {copied ? (
              <Check className='mr-1.5 h-3.5 w-3.5 text-emerald-600' />
            ) : (
              <Copy className='mr-1.5 h-3.5 w-3.5' />
            )}
            {copied ? 'Copied' : 'Copy Formatted Text'}
          </Button>

          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handlePrint} className='text-xs'>
              <Printer className='mr-1.5 h-3.5 w-3.5' />
              Print
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className='text-xs'
            >
              {isExportingDocx ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              ) : (
                <ScrollText className='mr-1.5 h-3.5 w-3.5 text-blue-600' />
              )}
              Export Word (.docx)
            </Button>
            <Button size='sm' onClick={handleExportPdf} disabled={isExportingPdf} className='text-xs'>
              {isExportingPdf ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              ) : (
                <Download className='mr-1.5 h-3.5 w-3.5' />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
