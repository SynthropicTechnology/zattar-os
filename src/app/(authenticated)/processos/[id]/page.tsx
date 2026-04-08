/**
 * Página de Visualização de Processo
 *
 * Rota: /processos/[id]
 *
 * Exibe dados completos do processo com timeline de movimentações e documentos.
 * Inicia captura automática caso a timeline não exista no Supabase (campo timeline_jsonb).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProcessoVisualizacao } from '@/app/(authenticated)/processos';

interface ProcessoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProcessoPageProps): Promise<Metadata> {
  const { id } = await params;

  // Validar ID
  const processoId = parseInt(id);
  if (isNaN(processoId)) {
    return {
      title: 'Processo não encontrado',
    };
  }

  return {
    title: `Processo - Synthropic`,
    description: 'Visualização detalhada do processo com timeline completa',
  };
}

export default async function ProcessoPage({ params }: ProcessoPageProps) {
  const { id } = await params;

  // Validar ID
  const processoId = parseInt(id);
  if (isNaN(processoId)) {
    notFound();
  }

  return <ProcessoVisualizacao id={processoId} />;
}
