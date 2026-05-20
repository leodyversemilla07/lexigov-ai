import type { DraftSection } from '@lexigov/shared';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Separator } from '@lexigov/ui/components/separator';
import { Textarea } from '@lexigov/ui/components/textarea';
import { Trash2 } from 'lucide-react';

type SectionEditorProps = {
  selectedSection: DraftSection | null;
  selectedSectionNumber: number;
  totalSections: number;
  onSectionChange: (sectionId: string, field: 'heading' | 'body', value: string) => void;
  onRemoveSection: (sectionId: string) => void;
};

export function SectionEditor({
  selectedSection,
  selectedSectionNumber,
  totalSections,
  onSectionChange,
  onRemoveSection,
}: SectionEditorProps) {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <CardTitle className='text-xl'>
              {selectedSection ? `Section ${selectedSectionNumber} editor` : 'Section editor'}
            </CardTitle>
            <CardDescription className='mt-1'>
              Refine the selected section without losing alignment with the full ordinance text.
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
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]'>
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
                Editing here updates the full text editor above immediately. Use this panel for focused revision, then
                save the draft when the language is final.
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
