import { Suspense } from 'react';
import { Metadata } from 'next';
import { ExpedientesContent } from '@/app/app/expedientes';
import { PageShell } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Expedientes | Lista',
  description: 'Lista de expedientes e intimações',
};

export const dynamic = 'force-dynamic';

function ExpedientesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function ExpedientesListaPage() {
  return (
    <PageShell>
      <Suspense fallback={<ExpedientesLoading />}>
        <ExpedientesContent visualizacao="lista" />
      </Suspense>
    </PageShell>
  );
}
