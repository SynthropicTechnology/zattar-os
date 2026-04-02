import { Suspense } from 'react';
import { ExpedientesContent } from '@/app/app/expedientes';
import { PageShell } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

/**
 * Fallback de loading para o Suspense
 */
function ExpedientesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/**
 * Página raiz de Expedientes
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function ExpedientesPage() {
  return (
    <PageShell>
      <Suspense fallback={<ExpedientesLoading />}>
        <ExpedientesContent visualizacao="semana" />
      </Suspense>
    </PageShell>
  );
}
