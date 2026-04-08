import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchContratoCompleto } from '@/app/(authenticated)/contratos/queries';
import { LancamentosRepository } from '@/app/(authenticated)/financeiro/repository';
import { fetchEntrevistaByContratoId } from '@/app/(authenticated)/entrevistas-trabalhistas/queries';
import { ContratoDetalhesClient } from './contrato-detalhes-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Contrato #${id}`,
    description: 'Detalhes do contrato',
  };
}

export default async function ContratoDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const contratoId = parseInt(id, 10);

  if (isNaN(contratoId) || contratoId <= 0) {
    notFound();
  }

  // Fetch contrato completo (query function, not server action)
  const result = await fetchContratoCompleto(contratoId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { contrato, cliente, responsavel, segmento } = result.data;

  // Fetch lançamentos financeiros e entrevista em paralelo
  const [lancamentos, entrevistaResult] = await Promise.all([
    LancamentosRepository.listar({ contratoId, limite: 50 }).catch((error) => {
      console.error('Erro ao buscar lançamentos:', error);
      return [] as Awaited<ReturnType<typeof LancamentosRepository.listar>>;
    }),
    fetchEntrevistaByContratoId(contratoId),
  ]);

  const entrevistaData = entrevistaResult.success ? entrevistaResult.data : null;

  return (
    <ContratoDetalhesClient
      contrato={contrato}
      cliente={cliente}
      responsavel={responsavel}
      segmento={segmento}
      lancamentos={lancamentos}
      entrevista={entrevistaData?.entrevista ?? null}
      entrevistaAnexos={entrevistaData?.anexos ?? []}
    />
  );
}
