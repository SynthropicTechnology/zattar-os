import { PageShell } from '@/components/shared/page-shell';
import { RepassesPageContent } from '@/app/(authenticated)/repasses';

export default function RepassesPage() {
  return (
    <PageShell title="Repasses Pendentes">
      <RepassesPageContent />
    </PageShell>
  );
}
