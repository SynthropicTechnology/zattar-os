import { Suspense } from 'react';
import { ObrigacoesContent } from '@/app/app/obrigacoes';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ObrigacoesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

/**
 * Página de Visualização Semanal de Obrigações
 */
export default function ObrigacoesSemanaPage() {
  return (
    <Suspense fallback={<ObrigacoesLoading />}>
      <ObrigacoesContent visualizacao="semana" />
    </Suspense>
  );
}
