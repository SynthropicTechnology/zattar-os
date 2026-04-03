import { Suspense } from 'react';
import { fetchAudienciasPageData } from '@/app/(authenticated)/audiencias/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AudienciasClient } from './audiencias-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="max-w-350 mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-60 rounded-xl" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function AudienciasPage() {
  const { usuarios, tiposAudiencia } = await fetchAudienciasPageData();

  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasClient
        initialView="quadro"
        initialUsuarios={usuarios}
        initialTiposAudiencia={tiposAudiencia}
      />
    </Suspense>
  );
}
