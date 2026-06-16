'use client';

import { Button } from '@lexigov/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: Array<{ key: string; label: string | number; isEllipsis: boolean }> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push({ key: `page-${i}`, label: i, isEllipsis: false });
    } else if (pages[pages.length - 1]?.label !== '...') {
      pages.push({ key: `ellipsis-${pages.length}`, label: '...', isEllipsis: true });
    }
  }

  return (
    <div className='flex items-center justify-between pt-4'>
      <p className='text-sm text-muted-foreground'>
        {total} {total === 1 ? 'result' : 'results'}
      </p>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label='Previous page'
        >
          <ChevronLeft className='size-4' />
        </Button>
        {pages.map((p) =>
          p.isEllipsis ? (
            <span key={p.key} className='px-2 text-muted-foreground'>
              ...
            </span>
          ) : (
            <Button
              key={p.key}
              variant={p.label === page ? 'default' : 'outline'}
              size='sm'
              className='min-w-9'
              onClick={() => onPageChange(p.label as number)}
              aria-label={`Page ${p.label}`}
              aria-current={p.label === page ? 'page' : undefined}
            >
              {p.label}
            </Button>
          ),
        )}
        <Button
          variant='outline'
          size='sm'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label='Next page'
        >
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  );
}
