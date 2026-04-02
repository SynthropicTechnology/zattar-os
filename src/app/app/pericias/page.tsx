import { PericiasContent } from '@/app/app/pericias';
import { PageShell } from '@/components/shared';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Perícias
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function PericiasPage() {
  return (
    <PageShell>
      <PericiasContent visualizacao="semana" />
    </PageShell>
  );
}


