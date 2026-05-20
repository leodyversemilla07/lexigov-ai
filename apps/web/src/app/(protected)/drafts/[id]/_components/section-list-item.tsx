import type { DraftSection } from '@lexigov/shared';
import { cn } from '@lexigov/shared';
import { Badge } from '@lexigov/ui/components/badge';

type SectionListItemProps = {
  section: DraftSection;
  index: number;
  active: boolean;
  onSelect: (sectionId: string) => void;
};

export function SectionListItem({ section, index, active, onSelect }: SectionListItemProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect(section.id)}
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-left transition-colors',
        active ? 'border-primary bg-muted' : 'bg-background hover:bg-muted/50',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
            Section {index + 1}
          </div>
          <div className='mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground'>{section.heading}</div>
        </div>
        <Badge variant='outline' className='rounded-full'>
          {section.body.trim() ? `${section.body.trim().split(/\s+/).length}w` : 'Empty'}
        </Badge>
      </div>
      <p className='mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground'>
        {section.body || 'No supporting body text yet.'}
      </p>
    </button>
  );
}
