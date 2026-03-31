import { PageShell } from '@/components/shared';
import { AudienciasMockClient } from './audiencias-mock-client';

export const dynamic = 'force-dynamic';

export default function AudienciasMockPage() {
  return (
    <PageShell>
      <AudienciasMockClient />
    </PageShell>
  );
}
