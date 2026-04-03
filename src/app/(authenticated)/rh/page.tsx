'use client';

/**
 * Página principal de RH
 * Usa tabs simples (shadcn) para alternar entre Salários e Folhas de Pagamento
 */

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { } from 'lucide-react';
import { PageShell } from '@/components/shared/page-shell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load dos componentes pesados
const SalariosList = React.lazy(() =>
  import('@/app/(authenticated)/rh/components/salarios/salarios-list').then((mod) => ({
    default: mod.SalariosList,
  }))
);
const FolhasPagamentoList = React.lazy(() =>
  import('@/app/(authenticated)/rh/components/folhas-pagamento/folhas-list').then((mod) => ({
    default: mod.FolhasPagamentoList,
  }))
);

type RHView = 'salarios' | 'folhas-pagamento';
const VALID_TABS = new Set<RHView>(['salarios', 'folhas-pagamento']);

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function RHPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: RHView =
    tabParam && VALID_TABS.has(tabParam as RHView)
      ? (tabParam as RHView)
      : 'salarios';

  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/app/rh?tab=${value}`, { scroll: false });
    },
    [router]
  );

  return (
    <PageShell>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList>
          <TabsTrigger value="salarios">
            Salários
          </TabsTrigger>
          <TabsTrigger value="folhas-pagamento">
            Folhas de Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salarios" className="flex-1 min-h-0 mt-6">
          <React.Suspense fallback={<TabSkeleton />}>
            <SalariosList />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="folhas-pagamento" className="flex-1 min-h-0 mt-6">
          <React.Suspense fallback={<TabSkeleton />}>
            <FolhasPagamentoList />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
