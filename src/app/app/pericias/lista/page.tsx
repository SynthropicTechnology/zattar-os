import type { Metadata } from 'next';
import { PericiasContent } from '@/app/app/pericias';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Lista',
  description: 'Lista de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasListaPage() {
  return (
    <PageShell>
      <PericiasContent visualizacao="lista" />
    </PageShell>
  );
}


