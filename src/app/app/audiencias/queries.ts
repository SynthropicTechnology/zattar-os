import 'server-only';

import { cache } from 'react';
import { actionListarUsuarios } from '@/app/app/usuarios';
import { actionListarTiposAudiencia } from './actions';
import type { TipoAudiencia } from './domain';

/**
 * Dados compartilhados pré-carregados no servidor para a página de Audiências.
 *
 * Elimina 2 server action POSTs do client (useUsuarios + useTiposAudiencias)
 * ao buscar os dados no Server Component e passar via props.
 *
 * React.cache() deduplica chamadas dentro do mesmo request/render pass.
 */

export type AudienciasPageData = {
  usuarios: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  tiposAudiencia: TipoAudiencia[];
};

export const fetchAudienciasPageData = cache(
  async (): Promise<AudienciasPageData> => {
    const [usuariosResult, tiposResult] = await Promise.all([
      actionListarUsuarios({}),
      actionListarTiposAudiencia({}),
    ]);

    const usuarios =
      usuariosResult.success && usuariosResult.data
        ? (usuariosResult.data.usuarios ?? [])
        : [];

    const tiposAudiencia: TipoAudiencia[] = tiposResult.success
      ? (tiposResult.data ?? [])
      : [];

    return { usuarios, tiposAudiencia };
  }
);
