import { PericiasMockClient } from '@/app/(authenticated)/pericias/components/pericias-mock-client';
import { PageShell } from '@/components/shared';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Perícias
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function PericiasPage() {
  return (
    <PageShell>
      <PericiasMockClient />
    </PageShell>
  );
}


