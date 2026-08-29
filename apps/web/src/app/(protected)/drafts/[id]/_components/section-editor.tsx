import type { DraftSection } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Separator } from '@lexigov/ui/components/separator';
import { Textarea } from '@lexigov/ui/components/textarea';
import { CheckCheck, Loader2, Scale, Shield, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

type SectionEditorProps = {
  selectedSection: DraftSection | null;
  selectedSectionNumber: number;
  totalSections: number;
  jurisdiction?: string;
  documentType?: string;
  onSectionChange: (sectionId: string, field: 'heading' | 'body', value: string) => void;
  onRemoveSection: (sectionId: string) => void;
};

export function SectionEditor({
  selectedSection,
  selectedSectionNumber,
  totalSections,
  jurisdiction = 'barangay',
  documentType = 'ORDINANCE',
  onSectionChange,
  onRemoveSection,
}: SectionEditorProps) {
  const [isAssisting, setIsAssisting] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAiAssist = async (action: 'expand' | 'formalize' | 'penalties' | 'simplify') => {
    if (!selectedSection) return;
    setIsAssisting(true);
    setActiveAction(action);

    try {
      const res = await api.post<{ sectionBody: string }>('/ai/assist-section', {
        sectionHeading: selectedSection.heading,
        sectionBody: selectedSection.body,
        action,
        jurisdiction,
        documentType,
      });

      if (res.sectionBody) {
        onSectionChange(selectedSection.id, 'body', res.sectionBody);
        toast.success(`Section updated with AI ${action} assistance.`);
      }
    } catch (err) {
      console.error('Failed to assist section:', err);
      toast.error('AI section assistance failed. Please try again.');
    } finally {
      setIsAssisting(false);
      setActiveAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <CardTitle className='text-xl'>
                {selectedSection ? `Section ${selectedSectionNumber} editor` : 'Section editor'}
              </CardTitle>
              <Badge variant='outline' className='text-xs capitalize'>
                {jurisdiction}
              </Badge>
            </div>
            <CardDescription className='mt-1'>
              Refine the selected section with focused drafting and inline AI assistance.
            </CardDescription>
          </div>
          {selectedSection ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onRemoveSection(selectedSection.id)}
              disabled={totalSections <= 1}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Remove section
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {selectedSection ? (
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='section-heading'>Section heading</Label>
                <Input
                  id='section-heading'
                  value={selectedSection.heading}
                  onChange={(event) => onSectionChange(selectedSection.id, 'heading', event.target.value)}
                  className='h-12 text-base font-medium'
                />
              </div>

              {/* AI Quick Actions Bar */}
              <div className='flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2.5'>
                <span className='flex items-center text-xs font-semibold text-muted-foreground mr-1'>
                  <Sparkles className='mr-1 h-3.5 w-3.5 text-primary' />
                  AI Assist:
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs'
                  disabled={isAssisting}
                  onClick={() => handleAiAssist('expand')}
                >
                  {isAssisting && activeAction === 'expand' ? (
                    <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Wand2 className='mr-1 h-3.5 w-3.5 text-primary' />
                  )}
                  Expand Details
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs'
                  disabled={isAssisting}
                  onClick={() => handleAiAssist('formalize')}
                >
                  {isAssisting && activeAction === 'formalize' ? (
                    <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Scale className='mr-1 h-3.5 w-3.5 text-sky-600' />
                  )}
                  Formalize Phrasing
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs'
                  disabled={isAssisting}
                  onClick={() => handleAiAssist('penalties')}
                >
                  {isAssisting && activeAction === 'penalties' ? (
                    <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Shield className='mr-1 h-3.5 w-3.5 text-amber-600' />
                  )}
                  RA 7160 Penalties
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs'
                  disabled={isAssisting}
                  onClick={() => handleAiAssist('simplify')}
                >
                  {isAssisting && activeAction === 'simplify' ? (
                    <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <CheckCheck className='mr-1 h-3.5 w-3.5 text-emerald-600' />
                  )}
                  Simplify
                </Button>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='section-body'>Section body</Label>
                <Textarea
                  id='section-body'
                  value={selectedSection.body}
                  onChange={(event) => onSectionChange(selectedSection.id, 'body', event.target.value)}
                  rows={14}
                  className='min-h-[320px] font-mono text-sm leading-7'
                  placeholder='Write the text for this section...'
                />
              </div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-4'>
              <div className='text-xs font-medium text-muted-foreground'>Section snapshot</div>
              <div className='mt-3 text-lg font-semibold leading-tight'>
                {selectedSection.heading || 'Untitled section'}
              </div>
              <Separator className='my-4' />
              <div className='space-y-3 text-sm text-muted-foreground'>
                <div className='flex items-center justify-between gap-3'>
                  <span>Word count</span>
                  <span className='font-medium text-foreground'>
                    {selectedSection.body.trim() ? selectedSection.body.trim().split(/\s+/).length : 0}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span>Characters</span>
                  <span className='font-medium text-foreground'>{selectedSection.body.length}</span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span>Position</span>
                  <span className='font-medium text-foreground'>
                    Section {selectedSectionNumber} of {totalSections}
                  </span>
                </div>
              </div>
              <div className='mt-5 rounded-lg border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground'>
                Use the AI quick action buttons to instantly expand, formalize, or align this section with statutory RA
                7160 limits.
              </div>
            </div>
          </div>
        ) : (
          <div className='rounded-lg border border-dashed p-8 text-sm leading-6 text-muted-foreground'>
            Select or create a section to begin structured editing.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
