import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const metadata: Metadata = {
  title: 'Perícias | Ano',
  description: 'Visualização anual de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasAnoPage() {
  return <PericiasClient initialView="lista" />;
}


