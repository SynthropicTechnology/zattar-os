import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AgendamentosClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AgendamentosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-100 w-full" />
    </div>
  );
}

export default function AgendamentosPage() {
  return (
    <Suspense fallback={<AgendamentosLoading />}>
      <AgendamentosClient />
    </Suspense>
  );
}
