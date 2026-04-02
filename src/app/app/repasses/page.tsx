import { PageShell } from '@/components/shared/page-shell';
import { RepassesPageContent } from '@/app/app/repasses';

export default function RepassesPage() {
  return (
    <PageShell title="Repasses Pendentes">
      <RepassesPageContent />
    </PageShell>
  );
}
