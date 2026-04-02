import type { Metadata } from 'next';
import { PericiasContent } from '@/app/app/pericias';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Semanal',
  description: 'Visualização semanal de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasSemanaPage() {
  return (
    <PageShell>
      <PericiasContent visualizacao="semana" />
    </PageShell>
  );
}


