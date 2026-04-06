import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import NovaObrigacaoClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function FormLoading() {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function NovaObrigacaoPage() {
  return (
    <Suspense fallback={<FormLoading />}>
      <NovaObrigacaoClient />
    </Suspense>
  );
}
