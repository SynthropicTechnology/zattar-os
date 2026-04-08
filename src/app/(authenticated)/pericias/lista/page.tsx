import type { Metadata } from 'next';
import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const metadata: Metadata = {
  title: 'Perícias | Lista',
  description: 'Lista de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasListaPage() {
  return <PericiasClient initialView="lista" />;
}


