import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Semanal',
  description: 'Visualização semanal de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasSemanaPage() {
  return (
    <PageShell>
      <PericiasClient initialView="semana" />
    </PageShell>
  );
}


