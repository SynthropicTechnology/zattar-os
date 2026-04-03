import { SalariosList } from '@/app/(authenticated)/rh';
import { PageShell } from '@/components/shared/page-shell';

// Force dynamic rendering to avoid static prerendering issues with CopilotKit context
export const dynamic = 'force-dynamic';

export default function SalariosPage() {
  return (
    <PageShell>
      <SalariosList />
    </PageShell>
  );
}
