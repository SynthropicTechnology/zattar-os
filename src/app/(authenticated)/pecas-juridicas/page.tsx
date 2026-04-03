/**
 * Página de Modelos de Peças Jurídicas (Server Component)
 *
 * Gerencia modelos de peças jurídicas para geração de documentos.
 */

import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { listarPecasModelos, PecasModelosTableWrapper } from '@/app/(authenticated)/pecas-juridicas';

function PecasModelosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-100 w-full" />
    </div>
  );
}

export default async function PecasJuridicasPage() {
  // Fetch inicial de dados no servidor
  const result = await listarPecasModelos({
    apenasAtivos: true,
    page: 1,
    pageSize: 20,
    orderBy: 'titulo',
    orderDirection: 'asc',
  });

  const modelos = result.success ? result.data.data : [];
  const pagination = result.success ? result.data.pagination : null;

  return (
    <PageShell>
      <Suspense fallback={<PecasModelosLoading />}>
        <PecasModelosTableWrapper
          initialData={modelos}
          initialPagination={pagination}
        />
      </Suspense>
    </PageShell>
  );
}
