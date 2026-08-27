'use client';

import type { DocumentType, JurisdictionLevel } from '@lexigov/shared';
import {
  buildDraftSectionsFromBody,
  cn,
  getTemplateDescription,
  getTemplateSections,
  type TemplateCategory,
  type TemplateData,
  type TemplateEditorInput,
  type TemplateVisibility,
  templateCategoryValues,
  templateEditorSchema,
} from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lexigov/ui/components/dialog';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { Textarea } from '@lexigov/ui/components/textarea';
import {
  ArrowRight,
  FilePenLine,
  FileText,
  FolderOpen,
  Globe,
  Lock,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { useZodForm } from '@/hooks/use-zod-form';
import { api } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-hooks';
import { useSession } from '@/lib/auth-client';
import type { PaginatedResponse } from '@/types';

type EditableTemplate = TemplateData & {
  id: string;
  userId: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

const templateCategories: TemplateCategory[] = [...templateCategoryValues];
const documentTypes: DocumentType[] = ['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY'];
const jurisdictionOptions: JurisdictionLevel[] = ['barangay', 'municipal', 'city', 'provincial'];
const emptyTemplateForm: TemplateEditorInput = {
  name: '',
  category: templateCategories[0],
  subcategory: '',
  documentType: 'ORDINANCE',
  jurisdictions: ['barangay'],
  description: '',
  prompt: '',
  body: '',
  visibility: 'private',
};

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    'Public Safety': '🛡️',
    Environment: '🌿',
    Health: '🏥',
    Revenue: '💼',
    'Social Welfare': '🤝',
    Infrastructure: '🏗️',
    Education: '📚',
    Other: '📄',
  };
  return icons[category] || '📄';
}

function readTemplateField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getTemplateFormState(template?: EditableTemplate): TemplateEditorInput {
  if (!template) return emptyTemplateForm;
  const structure =
    template.structure && typeof template.structure === 'object' ? (template.structure as Record<string, unknown>) : {};
  const exampleContent =
    template.exampleContent && typeof template.exampleContent === 'object'
      ? (template.exampleContent as Record<string, unknown>)
      : {};
  return {
    name: template.name,
    category: (template.category as TemplateCategory) || templateCategories[0],
    subcategory: template.subcategory || '',
    documentType:
      ((readTemplateField(exampleContent.documentType) || readTemplateField(structure.documentType)) as DocumentType) ||
      'ORDINANCE',
    jurisdictions: template.jurisdiction.length > 0 ? (template.jurisdiction as JurisdictionLevel[]) : ['barangay'],
    description:
      readTemplateField(exampleContent.description) ||
      readTemplateField(exampleContent.summary) ||
      readTemplateField(structure.description) ||
      readTemplateField(structure.summary) ||
      '',
    prompt:
      readTemplateField(exampleContent.prompt) ||
      readTemplateField(exampleContent.instructions) ||
      readTemplateField(structure.prompt) ||
      readTemplateField(structure.instructions) ||
      '',
    body:
      readTemplateField(exampleContent.body) ||
      readTemplateField(exampleContent.content) ||
      readTemplateField(structure.body) ||
      readTemplateField(structure.content) ||
      readTemplateField(structure.template) ||
      '',
    visibility: template.isPublic ? 'public' : 'private',
  };
}

function buildTemplatePayload(form: TemplateEditorInput) {
  const sections = buildDraftSectionsFromBody(form.body.trim());
  return {
    name: form.name.trim(),
    category: form.category,
    subcategory: form.subcategory.trim() || undefined,
    jurisdiction: form.jurisdictions,
    structure: {
      documentType: form.documentType,
      description: form.description.trim(),
      prompt: form.prompt.trim(),
      body: form.body.trim(),
      sections,
    },
    exampleContent: {
      documentType: form.documentType,
      description: form.description.trim(),
      prompt: form.prompt.trim(),
      body: form.body.trim(),
      sections,
    },
    isPublic: form.visibility === 'public',
  };
}

function TemplateCard({
  template,
  owned,
  onEdit,
  onDelete,
}: {
  template: EditableTemplate;
  owned?: boolean;
  onEdit?: (template: EditableTemplate) => void;
  onDelete?: (template: EditableTemplate) => void;
}) {
  return (
    <Card className='border-border/70 bg-card/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl border border-primary/15 bg-primary/10 p-2.5'>
              <FileText className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-lg'>{template.name}</CardTitle>
              <CardDescription className='mt-1 flex items-center gap-1'>
                <span>{getCategoryIcon(template.category)}</span>
                <span>{template.category}</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant={template.isPublic ? 'default' : 'secondary'}>
            {template.isPublic ? <Globe className='mr-1 h-3 w-3' /> : <Lock className='mr-1 h-3 w-3' />}
            {template.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='line-clamp-3 text-sm text-muted-foreground'>{getTemplateDescription(template)}</p>
        <div className='flex flex-wrap gap-1.5'>
          {template.jurisdiction.map((jurisdiction) => (
            <Badge key={jurisdiction} variant='outline' className='text-xs capitalize'>
              {jurisdiction}
            </Badge>
          ))}
        </div>
        <div className='grid gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Uses</span>
            <span className='font-medium'>{template.usageCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Sections</span>
            <span className='font-medium'>{getTemplateSections(template).length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Updated</span>
            <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-4'>
          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            <Users className='h-3 w-3' />
            <span>{owned ? 'Owned by you' : 'Shared library'}</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {owned && onEdit ? (
              <Button variant='outline' size='sm' onClick={() => onEdit(template)}>
                <Pencil className='mr-1 h-3 w-3' />
                Edit
              </Button>
            ) : null}
            {owned && onDelete ? (
              <Button variant='outline' size='sm' onClick={() => onDelete(template)}>
                <Trash2 className='mr-1 h-3 w-3' />
                Delete
              </Button>
            ) : null}
            <Button variant='outline' size='sm' asChild>
              <Link href={`/drafts/new?template=${template.id}`}>
                Start Draft
                <ArrowRight className='ml-1 h-3 w-3' />
              </Link>
            </Button>
            <Button size='sm' asChild>
              <Link href={`/ai?template=${template.id}`}>
                <Sparkles className='mr-1 h-3 w-3' />
                Generate Draft
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 20;

export function TemplatesPageContent() {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const queryParams = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (categoryFilter !== 'ALL') queryParams.set('category', categoryFilter);

  const {
    data: templatesPage,
    isLoading,
    refetch: refetchTemplates,
  } = useApiQuery<PaginatedResponse<EditableTemplate>>(`/templates?${queryParams.toString()}`);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const templateForm = useZodForm({
    schema: templateEditorSchema,
    defaultValues: emptyTemplateForm,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = templateForm;
  const form = watch();

  const templates = templatesPage?.data ?? [];
  const currentUserId = session?.user?.id;
  const categories = [...new Set(templates.map((template) => template.category))].sort();

  const myTemplates = templates.filter((template) => template.userId === currentUserId);
  const publicTemplates = templates.filter((template) => template.isPublic && template.userId !== currentUserId);

  const openCreateDialog = () => {
    setEditingTemplateId(null);
    reset(emptyTemplateForm);
    setDialogOpen(true);
  };

  const openEditDialog = (template: EditableTemplate) => {
    setEditingTemplateId(template.id);
    reset(getTemplateFormState(template));
    setDialogOpen(true);
  };

  const handleJurisdictionToggle = (jurisdiction: JurisdictionLevel) => {
    const currentJurisdictions = getValues('jurisdictions');
    const active = currentJurisdictions.includes(jurisdiction);
    if (active && currentJurisdictions.length === 1) return;

    setValue(
      'jurisdictions',
      active ? currentJurisdictions.filter((value) => value !== jurisdiction) : [...currentJurisdictions, jurisdiction],
      { shouldValidate: true },
    );
  };

  const handleDialogSubmit = handleSubmit(async (values) => {
    try {
      const payload = buildTemplatePayload(values);
      if (editingTemplateId) {
        await api.post(`/templates/${editingTemplateId}`, payload);
        toast.success('Template updated.');
      } else {
        await api.post('/templates', payload);
        toast.success('Template created.');
      }
      setDialogOpen(false);
      setEditingTemplateId(null);
      reset(emptyTemplateForm);
      await refetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template. Please try again.');
    }
  });

  const handleDelete = async (template: EditableTemplate) => {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/templates/${template.id}`);
      await refetchTemplates();
      toast.success('Template deleted.');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template. Please try again.');
    }
  };

  const totalManagedTemplates = templates.filter((template) => template.userId === currentUserId).length;
  const totalPublicTemplates = templates.filter((template) => template.isPublic).length;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Templates</h1>
          <p className='text-muted-foreground'>
            Manage ordinance blueprints and publish reusable patterns for the wider LGU library.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' asChild>
            <Link href='/drafts/new'>
              <FilePenLine className='mr-2 h-4 w-4' />
              Create Custom Draft
            </Link>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className='mr-2 h-4 w-4' />
            New Template
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='border-border/60 bg-card/80'>
          <CardHeader className='pb-2'>
            <CardDescription>Your Templates</CardDescription>
            <CardTitle className='text-2xl'>{totalManagedTemplates}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Private and published templates you can edit directly.
          </CardContent>
        </Card>
        <Card className='border-border/60 bg-card/80'>
          <CardHeader className='pb-2'>
            <CardDescription>Public Library</CardDescription>
            <CardTitle className='text-2xl'>{totalPublicTemplates}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Shared templates available for drafting and AI generation.
          </CardContent>
        </Card>
        <Card className='border-border/60 bg-card/80'>
          <CardHeader className='pb-2'>
            <CardDescription>Current Filter</CardDescription>
            <CardTitle className='text-2xl'>{categoryFilter === 'ALL' ? 'All' : categoryFilter}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Search narrows both your management list and the shared library.
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/80'>
        <CardContent className='flex flex-wrap gap-4 p-4'>
          <div className='relative min-w-[220px] max-w-sm flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search templates...'
              className='pl-9'
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className='w-[220px]'>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <section className='space-y-4'>
        <div>
          <h2 className='text-xl font-semibold'>My Templates</h2>
          <p className='text-sm text-muted-foreground'>Build and maintain your own drafting blueprints.</p>
        </div>
        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2'>
            {['my-template-1', 'my-template-2', 'my-template-3', 'my-template-4'].map((skeletonKey) => (
              <Skeleton key={skeletonKey} className='h-64' />
            ))}
          </div>
        ) : myTemplates.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='py-14 text-center'>
              <FolderOpen className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <h3 className='text-lg font-medium'>No managed templates yet</h3>
              <p className='mx-auto mt-2 max-w-xl text-sm text-muted-foreground'>
                Save your first ordinance blueprint here to standardize recurring LGU drafting work.
              </p>
              <Button className='mt-4' onClick={openCreateDialog}>
                <Plus className='mr-2 h-4 w-4' />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 xl:grid-cols-2'>
            {myTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                owned
                onEdit={openEditDialog}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <div>
          <h2 className='text-xl font-semibold'>Public Library</h2>
          <p className='text-sm text-muted-foreground'>Shared ordinance patterns you can reuse immediately.</p>
        </div>
        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {[
              'public-template-1',
              'public-template-2',
              'public-template-3',
              'public-template-4',
              'public-template-5',
              'public-template-6',
            ].map((skeletonKey) => (
              <Skeleton key={skeletonKey} className='h-64' />
            ))}
          </div>
        ) : publicTemplates.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='py-14 text-center'>
              <FolderOpen className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <h3 className='text-lg font-medium'>No public templates match the current filter</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Try another category or publish one of your own templates to seed the shared library.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {publicTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>

      <Card className='border-border/60 bg-card/80'>
        <CardHeader>
          <CardTitle>Template Workflow</CardTitle>
          <CardDescription>Keep the library useful by treating templates as real drafting assets.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div className='flex gap-3'>
            <div className='h-fit rounded-lg bg-primary/10 p-2'>
              <Pencil className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h4 className='font-medium'>Design the blueprint</h4>
              <p className='text-sm text-muted-foreground'>
                Capture category, prompt guidance, and an editable ordinance body.
              </p>
            </div>
          </div>
          <div className='flex gap-3'>
            <div className='h-fit rounded-lg bg-primary/10 p-2'>
              <Globe className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h4 className='font-medium'>Choose visibility</h4>
              <p className='text-sm text-muted-foreground'>
                Keep templates private while refining them, then publish when they are ready to share.
              </p>
            </div>
          </div>
          <div className='flex gap-3'>
            <div className='h-fit rounded-lg bg-primary/10 p-2'>
              <Sparkles className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h4 className='font-medium'>Launch into drafting</h4>
              <p className='text-sm text-muted-foreground'>
                Send a template into either the manual drafting path or the AI generation flow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {templatesPage && (
        <Pagination
          page={templatesPage.page}
          totalPages={templatesPage.totalPages}
          total={templatesPage.total}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTemplateId(null);
            reset(emptyTemplateForm);
          }
        }}
      >
        <DialogContent className='max-w-4xl'>
          <form onSubmit={handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTemplateId ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                Capture a reusable ordinance pattern with prompt guidance and starter content.
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-6 py-4 lg:grid-cols-[1.4fr_1fr]'>
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='template-name'>Template Name</Label>
                    <Input id='template-name' placeholder='Example: Barangay Curfew Ordinance' {...register('name')} />
                    {errors.name ? <p className='text-sm text-destructive'>{errors.name.message}</p> : null}
                  </div>
                  <div className='space-y-2'>
                    <Label>Category</Label>
                    <Controller
                      control={control}
                      name='category'
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {templateCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {getCategoryIcon(category)} {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category ? <p className='text-sm text-destructive'>{errors.category.message}</p> : null}
                  </div>
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='template-subcategory'>Focus Area</Label>
                    <Input id='template-subcategory' placeholder='Example: Youth safety' {...register('subcategory')} />
                    {errors.subcategory ? (
                      <p className='text-sm text-destructive'>{errors.subcategory.message}</p>
                    ) : null}
                  </div>
                  <div className='space-y-2'>
                    <Label>Document Type</Label>
                    <Controller
                      control={control}
                      name='documentType'
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((documentType) => (
                              <SelectItem key={documentType} value={documentType}>
                                {documentType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.documentType ? (
                      <p className='text-sm text-destructive'>{errors.documentType.message}</p>
                    ) : null}
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Jurisdictions</Label>
                  <div className='flex flex-wrap gap-2'>
                    {jurisdictionOptions.map((jurisdiction) => {
                      const active = form.jurisdictions.includes(jurisdiction);
                      return (
                        <button
                          key={jurisdiction}
                          type='button'
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-sm capitalize transition-colors',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:border-primary/50',
                          )}
                          onClick={() => handleJurisdictionToggle(jurisdiction)}
                        >
                          {jurisdiction}
                        </button>
                      );
                    })}
                  </div>
                  {errors.jurisdictions ? (
                    <p className='text-sm text-destructive'>{errors.jurisdictions.message}</p>
                  ) : null}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='template-description'>Template Summary</Label>
                  <Textarea
                    id='template-description'
                    placeholder='Describe when this template should be used and what it covers.'
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description ? <p className='text-sm text-destructive'>{errors.description.message}</p> : null}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='template-prompt'>AI Prompt Guidance</Label>
                  <Textarea
                    id='template-prompt'
                    placeholder='Explain how the AI should interpret and expand this template.'
                    rows={4}
                    {...register('prompt')}
                  />
                  {errors.prompt ? <p className='text-sm text-destructive'>{errors.prompt.message}</p> : null}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='template-body'>Starter Body</Label>
                  <Textarea
                    id='template-body'
                    placeholder='Provide the reusable ordinance skeleton or sample sections.'
                    rows={10}
                    {...register('body')}
                  />
                  {errors.body ? <p className='text-sm text-destructive'>{errors.body.message}</p> : null}
                </div>
              </div>

              <div className='space-y-4'>
                <Card className='border-border/60 bg-muted/30'>
                  <CardHeader>
                    <CardTitle className='text-base'>Publishing</CardTitle>
                    <CardDescription>Choose who can see and use this template.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {(['private', 'public'] as TemplateVisibility[]).map((visibility) => (
                      <button
                        key={visibility}
                        type='button'
                        className={cn(
                          'w-full rounded-xl border p-3 text-left transition-colors',
                          form.visibility === visibility
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                        onClick={() => setValue('visibility', visibility, { shouldValidate: true })}
                      >
                        <div className='flex items-center gap-2 font-medium'>
                          {visibility === 'private' ? <Lock className='h-4 w-4' /> : <Globe className='h-4 w-4' />}
                          {visibility === 'private' ? 'Private' : 'Public'}
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {visibility === 'private'
                            ? 'Only your account can manage and use it.'
                            : 'Shared in the library so other users can draft from it.'}
                        </p>
                      </button>
                    ))}
                    {errors.visibility ? <p className='text-sm text-destructive'>{errors.visibility.message}</p> : null}
                  </CardContent>
                </Card>
                <Card className='border-border/60 bg-muted/30'>
                  <CardHeader>
                    <CardTitle className='text-base'>Blueprint Preview</CardTitle>
                    <CardDescription>How this template will read inside the library.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3 text-sm'>
                    <div className='font-medium'>{form.name || 'Untitled template'}</div>
                    <div className='text-muted-foreground'>
                      {form.description || 'Add a summary to help other drafters choose the right template.'}
                    </div>
                    <div className='flex flex-wrap gap-1.5'>
                      {form.jurisdictions.map((jurisdiction) => (
                        <Badge key={jurisdiction} variant='outline' className='capitalize'>
                          {jurisdiction}
                        </Badge>
                      ))}
                    </div>
                    <div className='rounded-lg border bg-background p-3 text-xs text-muted-foreground whitespace-pre-wrap'>
                      {form.body || 'Starter body preview will appear here.'}
                    </div>
                    <div className='space-y-2'>
                      <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                        Structured Sections
                      </div>
                      {buildDraftSectionsFromBody(form.body).length === 0 ? (
                        <div className='rounded-lg border border-dashed p-3 text-xs text-muted-foreground'>
                          Add headings like &quot;SECTION 1. Title.&quot; to save explicit template sections.
                        </div>
                      ) : (
                        buildDraftSectionsFromBody(form.body).map((section, index) => (
                          <div key={section.id} className='rounded-lg border bg-background p-3 text-xs'>
                            <div className='font-medium'>{section.heading}</div>
                            <div className='mt-1 text-muted-foreground'>Section {index + 1}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingTemplateId ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TemplatesLoading() {
  return (
    <div className='space-y-6'>
      <div>
        <Skeleton className='mb-2 h-10 w-64' />
        <Skeleton className='h-5 w-96' />
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {['templates-loading-stat-1', 'templates-loading-stat-2', 'templates-loading-stat-3'].map((skeletonKey) => (
          <Skeleton key={skeletonKey} className='h-32' />
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {[
          'templates-loading-card-1',
          'templates-loading-card-2',
          'templates-loading-card-3',
          'templates-loading-card-4',
        ].map((skeletonKey) => (
          <Skeleton key={skeletonKey} className='h-64' />
        ))}
      </div>
    </div>
  );
}


