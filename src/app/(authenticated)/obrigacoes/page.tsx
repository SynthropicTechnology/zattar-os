import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Obrigações',
  description: 'Gestão de obrigações, acordos, condenações e parcelas.',
};

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Obrigações
 * Redireciona automaticamente para a Lista
 */
export default function ObrigacoesPage() {
  redirect('/obrigacoes/lista');
}
