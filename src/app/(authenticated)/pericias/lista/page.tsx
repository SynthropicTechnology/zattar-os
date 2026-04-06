import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Lista',
  description: 'Lista de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasListaPage() {
  return (
    <PageShell>
      <PericiasClient initialView="lista" />
    </PageShell>
  );
}


