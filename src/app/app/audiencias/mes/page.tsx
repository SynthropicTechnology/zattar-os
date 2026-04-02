import { Suspense } from 'react';
import { fetchAudienciasPageData } from '@/app/app/audiencias/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AudienciasClient } from '../audiencias-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="max-w-350 mx-auto space-y-5">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-120 w-full rounded-2xl" />
    </div>
  );
}

export default async function AudienciasMesPage() {
  const { usuarios, tiposAudiencia } = await fetchAudienciasPageData();

  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasClient
        initialView="mes"
        initialUsuarios={usuarios}
        initialTiposAudiencia={tiposAudiencia}
      />
    </Suspense>
  );
}
