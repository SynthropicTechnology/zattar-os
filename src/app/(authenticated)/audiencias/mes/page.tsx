import { Suspense } from 'react';
import { authenticateRequest } from '@/lib/auth/session';
import { fetchAudienciasPageData } from '@/app/(authenticated)/audiencias/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AudienciasClient } from '../audiencias-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-120 w-full rounded-2xl" />
    </div>
  );
}

export default async function AudienciasMesPage() {
  const [session, { usuarios, tiposAudiencia }] = await Promise.all([
    authenticateRequest(),
    fetchAudienciasPageData(),
  ]);

  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasClient
        initialView="mes"
        initialUsuarios={usuarios}
        initialTiposAudiencia={tiposAudiencia}
        currentUserId={session?.id ?? 0}
      />
    </Suspense>
  );
}
