import { Suspense } from 'react';
import { fetchAudienciasPageData } from '@/app/(authenticated)/audiencias/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AudienciasClient } from '../audiencias-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="max-w-350 mx-auto space-y-5">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

export default async function AudienciasQuadroPage() {
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
