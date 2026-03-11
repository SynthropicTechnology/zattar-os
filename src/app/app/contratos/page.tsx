/**
 * Página de Contratos (Server Component)
 *
 * Lista e gerencia contratos jurídicos do escritório.
 * Dados são carregados no servidor para melhor performance e SEO.
 *
 * Todas as queries de dados auxiliares (clientes, partes, usuários, segmentos)
 * são executadas aqui no servidor em paralelo, evitando Server Action POSTs
 * desnecessários no client-side.
 */

import { Suspense } from 'react';
import { listarContratos, ContratosTableWrapper } from '@/features/contratos';
import { listarClientes, listarPartesContrarias } from '@/features/partes/service';
import { service as usuariosService } from '@/features/usuarios/service';
import { createDbClient } from '@/lib/supabase';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

function ContratosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-100 w-full" />
    </div>
  );
}

/** Busca segmentos ativos diretamente no servidor (evita Server Action POST) */
async function fetchSegmentosAtivos() {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('segmentos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (error) return [];
    return (data || []).map((s: { id: number; nome: string }) => ({ id: s.id, nome: s.nome }));
  } catch {
    return [];
  }
}

/** Busca usuários ativos diretamente via service (evita Server Action POST) */
async function fetchUsuariosAtivos() {
  try {
    const result = await usuariosService.listarUsuarios({ limite: 1000, ativo: true });
    return result.usuarios.map((u: { id: number; nomeExibicao?: string; nomeCompleto: string; avatarUrl?: string | null }) => ({
      id: u.id,
      nome: u.nomeExibicao || u.nomeCompleto,
      avatarUrl: u.avatarUrl ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function ContratosPage() {
  // Fetch paralelo de TODOS os dados no servidor — zero Server Actions no client mount
  const [contratosResult, clientesResult, partesContrariasResult, usuariosOptions, segmentosOptions] =
    await Promise.all([
      listarContratos({ pagina: 1, limite: 50 }),
      listarClientes({ limite: 1000 }),
      listarPartesContrarias({ limite: 1000 }),
      fetchUsuariosAtivos(),
      fetchSegmentosAtivos(),
    ]);

  const contratos = contratosResult.success ? contratosResult.data.data : [];
  const pagination = contratosResult.success ? contratosResult.data.pagination : null;

  // Preparar options para os selects (apenas id e nome)
  const clientesOptions = clientesResult.success
    ? clientesResult.data.data.map((c: { id: number; nome: string }) => ({ id: c.id, nome: c.nome }))
    : [];

  const partesContrariasOptions = partesContrariasResult.success
    ? partesContrariasResult.data.data.map((p: { id: number; nome: string }) => ({ id: p.id, nome: p.nome }))
    : [];

  return (
    <PageShell>
      <Suspense fallback={<ContratosLoading />}>
        <ContratosTableWrapper
          initialData={contratos}
          initialPagination={pagination}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
          segmentosOptions={segmentosOptions}
        />
      </Suspense>
    </PageShell>
  );
}
