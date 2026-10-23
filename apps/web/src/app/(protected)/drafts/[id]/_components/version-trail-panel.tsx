import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Skeleton } from '@lexigov/ui/components/skeleton';
import { Loader2, RotateCcw } from 'lucide-react';
import { SidePanelCard } from './side-panel-card';
import type { DraftVersion } from './types';

type VersionTrailPanelProps = {
  versionHistory: DraftVersion[] | undefined;
  isRestoringVersionId: string | null;
  onRestoreVersion: (versionId: string, versionNumber: number) => void;
  readOnly?: boolean;
};

export function VersionTrailPanel({
  versionHistory,
  isRestoringVersionId,
  onRestoreVersion,
  readOnly = false,
}: VersionTrailPanelProps) {
  return (
    <SidePanelCard title='Version trail' description='Recent saved states and related actions.'>
      <div className='space-y-4'>
        {versionHistory === undefined ? (
          <Skeleton className='h-28 rounded-2xl' />
        ) : versionHistory.length === 0 ? (
          <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
            No saved revisions yet.
          </div>
        ) : (
          <div className='space-y-3'>
            {versionHistory.slice(0, 4).map((version) => (
              <div key={version.id} className='rounded-lg border p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='font-medium'>
                    v{version.version} {version.isCurrent ? 'Current' : ''}
                  </div>
                  <Badge variant={version.isCurrent ? 'default' : 'outline'}>{version.status}</Badge>
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>{new Date(version.updatedAt).toLocaleString()}</div>
                {version.commitMessage ? (
                  <div className='mt-2 text-sm text-muted-foreground'>{version.commitMessage}</div>
                ) : null}
                {!version.isCurrent ? (
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-3 w-full justify-between'
                    onClick={() => onRestoreVersion(version.id, version.version)}
                    disabled={readOnly || isRestoringVersionId !== null}
                  >
                    {isRestoringVersionId === version.id ? (
                      <>
                        Restoring
                        <Loader2 className='h-4 w-4 animate-spin' />
                      </>
                    ) : (
                      <>
                        Restore this version
                        <RotateCcw className='h-4 w-4' />
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </SidePanelCard>
  );
}
