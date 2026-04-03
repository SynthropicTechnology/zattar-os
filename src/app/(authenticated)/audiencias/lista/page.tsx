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
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function AudienciasListaPage() {
  const { usuarios, tiposAudiencia } = await fetchAudienciasPageData();

  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasClient
        initialView="lista"
        initialUsuarios={usuarios}
        initialTiposAudiencia={tiposAudiencia}
      />
    </Suspense>
  );
}
