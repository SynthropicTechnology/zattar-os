import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const metadata: Metadata = {
  title: 'Perícias | Mês',
  description: 'Visualização mensal de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasMesPage() {
  return <PericiasClient initialView="lista" />;
}


