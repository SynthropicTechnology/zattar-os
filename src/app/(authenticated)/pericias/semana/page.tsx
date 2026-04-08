import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const metadata: Metadata = {
  title: 'Perícias | Semanal',
  description: 'Visualização semanal de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasSemanaPage() {
  return <PericiasClient initialView="semana" />;
}


