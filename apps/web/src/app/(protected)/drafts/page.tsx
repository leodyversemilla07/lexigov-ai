'use client';

import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent } from '@lexigov/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lexigov/ui/components/dropdown-menu';
import { Input } from '@lexigov/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import {
  ArrowRight,
  Download,
  FileCheck,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { useApiQuery } from '@/lib/api-hooks';
import type { ApiDraft, PaginatedResponse } from '@/types';

const PAGE_SIZE = 20;

export default function DraftsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const queryParams = new URLSearchParams({
    page: String(currentPage),
    limit: String(PAGE_SIZE),
  });
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
  if (typeFilter !== 'ALL') queryParams.set('documentType', typeFilter);

  const apiPath = `/drafts?${queryParams.toString()}`;
  const { data: draftsPage, isLoading } = useApiQuery<PaginatedResponse<ApiDraft>>(apiPath);
  const drafts = draftsPage?.data ?? [];
  const totalCount = draftsPage?.total ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'FINAL':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>My Drafts</h1>
          <p className='text-muted-foreground mt-1'>Manage and organize your ordinance drafts</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link href='/ai'>
              <Sparkles className='w-4 h-4 mr-2' />
              AI Generator
            </Link>
          </Button>
          <Button asChild>
            <Link href='/drafts/new'>
              <Plus className='w-4 h-4 mr-2' />
              New Draft
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <FileText className='h-5 w-5 text-primary' />
            </div>
            <div>
              <div className='text-2xl font-bold'>{totalCount}</div>
              <div className='text-sm text-muted-foreground'>Total Drafts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4 flex flex-wrap items-center gap-4'>
          <div className='relative flex-1 min-w-[200px] max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Search drafts...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className='pl-9'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-muted-foreground' />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Status</SelectItem>
                <SelectItem value='DRAFT'>Draft</SelectItem>
                <SelectItem value='REVIEW'>Review</SelectItem>
                <SelectItem value='FINAL'>Final</SelectItem>
                <SelectItem value='ARCHIVED'>Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Types</SelectItem>
                <SelectItem value='ORDINANCE'>Ordinance</SelectItem>
                <SelectItem value='RESOLUTION'>Resolution</SelectItem>
                <SelectItem value='MEMORANDUM'>Memorandum</SelectItem>
                <SelectItem value='POLICY'>Policy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drafts List */}
      <Card>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='p-6 space-y-4'>
              {['draft-skeleton-1', 'draft-skeleton-2', 'draft-skeleton-3', 'draft-skeleton-4', 'draft-skeleton-5'].map(
                (skeletonKey) => (
                  <Skeleton key={skeletonKey} className='h-20' />
                ),
              )}
            </div>
          ) : !drafts || drafts.length === 0 ? (
            <div className='p-12 text-center'>
              <FileText className='w-16 h-16 mx-auto mb-4 text-muted' />
              <h3 className='text-lg font-medium mb-2'>No drafts found</h3>
              <p className='text-muted-foreground mb-6'>
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first ordinance draft'}
              </p>
              {!searchQuery && statusFilter === 'ALL' && typeFilter === 'ALL' && (
                <div className='flex justify-center gap-4'>
                  <Button asChild>
                    <Link href='/ai'>
                      <Sparkles className='w-4 h-4 mr-2' />
                      Create with AI
                    </Link>
                  </Button>
                  <Button variant='outline' asChild>
                    <Link href='/drafts/new'>
                      <Plus className='w-4 h-4 mr-2' />
                      Create Manually
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='divide-y'>
              {drafts.map((draft: ApiDraft) => (
                <div key={draft.id} className='p-4 hover:bg-muted/50 transition-colors'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-4 flex-1 min-w-0'>
                      <div className='p-2 bg-muted rounded-lg shrink-0'>
                        <FileText className='h-5 w-5 text-muted-foreground' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-semibold truncate'>{draft.title}</h3>
                          {draft.aiGenerated && (
                            <Badge variant='secondary' className='shrink-0'>
                              <Sparkles className='w-3 h-3 mr-1' />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className='flex items-center gap-3 text-sm text-muted-foreground flex-wrap'>
                          <span className='font-medium'>{draft.documentType}</span>
                          <span>•</span>
                          <span className='truncate max-w-[200px]'>{draft.jurisdictionName}</span>
                          <span>•</span>
                          <span>v{draft.version}</span>
                          <span>•</span>
                          <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 shrink-0'>
                      <Badge className={getStatusColor(draft.status)}>{draft.status}</Badge>

                      <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='sm' asChild>
                          <Link href={`/drafts/${draft.id}`}>
                            Edit
                            <ArrowRight className='ml-1 h-3 w-3' />
                          </Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link href={`/compliance?draft=${draft.id}`}>
                                <Shield className='mr-2 h-4 w-4' />
                                Check Compliance
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/export?draft=${draft.id}`}>
                                <Download className='mr-2 h-4 w-4' />
                                Export
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/compare?draft=${draft.id}`}>
                                <FileCheck className='mr-2 h-4 w-4' />
                                Compare Versions
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/templates?draft=${draft.id}`}>
                                <FileText className='mr-2 h-4 w-4' />
                                Use Template
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {draftsPage && (
        <Pagination
          page={draftsPage.page}
          totalPages={draftsPage.totalPages}
          total={draftsPage.total}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
