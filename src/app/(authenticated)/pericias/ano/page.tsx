import type { Metadata } from 'next';
import { PericiasContent } from '@/app/(authenticated)/pericias';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Ano',
  description: 'Visualização anual de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasAnoPage() {
  return (
    <PageShell>
      <PericiasContent visualizacao="ano" />
    </PageShell>
  );
}


