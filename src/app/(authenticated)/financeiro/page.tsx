import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { FinanceiroDashboard } from '@/app/(authenticated)/financeiro';
import { Skeleton } from '@/components/ui/skeleton';
import { FinanceiroNavigationSelect } from './components/financeiro-navigation-select';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FinanceiroPage() {
  return (
    <PageShell title="Financeiro" className="space-y-6">
      <FinanceiroNavigationSelect />
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <FinanceiroDashboard />
      </Suspense>
    </PageShell>
  );
}
