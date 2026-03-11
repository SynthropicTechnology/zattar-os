import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CapturaHistoricoClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function HistoricoLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-125 w-full" />
    </div>
  );
}

export default function CapturaHistoricoPage() {
  return (
    <Suspense fallback={<HistoricoLoading />}>
      <CapturaHistoricoClient />
    </Suspense>
  );
}
