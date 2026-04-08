import { authenticateRequest } from '@/lib/auth/session';
import { ProcessosClient } from './processos-client';
import { listarProcessos, buscarUsuariosRelacionados, listarTribunais } from './service';
import { obterEstatisticasProcessos } from './service-estatisticas';
import type { ProcessoUnificado } from './domain';

interface ProcessosPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProcessosPage({ searchParams: _ }: ProcessosPageProps) {
  const session = await authenticateRequest();

  const [processosResult, tribunaisResult, stats] = await Promise.all([
    listarProcessos({ pagina: 1, limite: 200, unified: true }),
    listarTribunais(),
    obterEstatisticasProcessos(),
  ]);

  const processos: ProcessoUnificado[] = processosResult.success
    ? (processosResult.data.data as ProcessoUnificado[])
    : [];
  const total = processosResult.success ? processosResult.data.pagination.total : 0;
  const tribunais = tribunaisResult.success
    ? tribunaisResult.data.map((tribunal) => tribunal.codigo)
    : [];

  // Resolve user names from processos array
  const usersRecord = processos.length > 0
    ? await buscarUsuariosRelacionados(processos)
    : {};

  const usuarios = Object.entries(usersRecord).map(([id, u]) => ({
    id: Number(id),
    nomeExibicao: u.nome,
    avatarUrl: u.avatarUrl ?? null,
  }));

  return (
    <ProcessosClient
      initialProcessos={processos}
      initialTotal={total}
      initialStats={stats}
      tribunais={tribunais}
      usuarios={usuarios}
      currentUserId={session?.id ?? 0}
    />
  );
}
