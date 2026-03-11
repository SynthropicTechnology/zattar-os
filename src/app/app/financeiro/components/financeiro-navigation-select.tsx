'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FINANCEIRO_PAGES = [
  { value: '/app/financeiro', label: 'Dashboard' },
  { value: '/app/financeiro/orcamentos', label: 'Orçamentos' },
  { value: '/app/financeiro/contas-pagar', label: 'Contas a Pagar' },
  { value: '/app/financeiro/contas-receber', label: 'Contas a Receber' },
  { value: '/app/financeiro/plano-contas', label: 'Plano de Contas' },
  { value: '/app/financeiro/conciliacao-bancaria', label: 'Conciliação' },
  { value: '/app/financeiro/dre', label: 'DRE' },
  { value: '/app/rh/salarios', label: 'Salários' },
  { value: '/app/rh/folhas-pagamento', label: 'Folhas de Pagamento' },
] as const;

function getCurrentValue(pathname: string): string {
  const exact = FINANCEIRO_PAGES.find((page) => page.value === pathname);
  if (exact) return exact.value;

  const byPrefix = FINANCEIRO_PAGES.find(
    (page) => page.value !== '/app/financeiro' && pathname.startsWith(page.value)
  );
  if (byPrefix) return byPrefix.value;

  return '/app/financeiro';
}

export function FinanceiroNavigationSelect() {
  const router = useRouter();
  const pathname = usePathname();

  const currentValue = React.useMemo(() => getCurrentValue(pathname), [pathname]);

  return (
    <div className="w-full max-w-sm">
      <Select value={currentValue} onValueChange={(value) => router.push(value)}>
        <SelectTrigger aria-label="Navegação do módulo financeiro" className="bg-card">
          <SelectValue placeholder="Ir para..." />
        </SelectTrigger>
        <SelectContent className="bg-card">
          {FINANCEIRO_PAGES.map((page) => (
            <SelectItem key={page.value} value={page.value}>
              {page.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
