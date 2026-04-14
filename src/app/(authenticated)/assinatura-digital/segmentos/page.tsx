import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { SegmentosClient } from './client-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function SegmentosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-125 w-full" />
    </div>
  );
}

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<SegmentosLoading />}>
        <SegmentosClient />
      </Suspense>
    </PageShell>
  );
}
