/**
 * Repository para cadastros PJE
 * Funções de persistência para mapear entidades aos seus IDs nos sistemas judiciais
 */

import { createServiceClient } from '@/lib/supabase/service-client';

export type TipoEntidadeCadastroPJE = 'cliente' | 'parte_contraria' | 'terceiro' | 'representante';
export type SistemaJudicial = 'pje_trt' | 'pje_tst' | 'esaj' | 'projudi';

export interface CadastroPJE {
  id: number;
  tipo_entidade: TipoEntidadeCadastroPJE;
  entidade_id: number;
  id_pessoa_pje: number;
  sistema: SistemaJudicial;
  tribunal: string;
  grau: 'primeiro_grau' | 'segundo_grau' | null;
  dados_cadastro_pje: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertCadastroPJEParams {
  tipo_entidade: TipoEntidadeCadastroPJE;
  entidade_id: number;
  id_pessoa_pje: number;
  sistema?: SistemaJudicial;
  tribunal: string;
  grau?: 'primeiro_grau' | 'segundo_grau' | null;
  dados_cadastro_pje?: Record<string, unknown> | null;
}

export interface BuscarEntidadePorIdPessoaPJEParams {
  tipo_entidade: TipoEntidadeCadastroPJE;
  id_pessoa_pje: number;
  sistema?: SistemaJudicial;
  tribunal?: string;
  grau?: 'primeiro_grau' | 'segundo_grau' | null;
}

/**
 * Cria ou atualiza um cadastro PJE
 */
export async function upsertCadastroPJE(
  params: UpsertCadastroPJEParams
): Promise<CadastroPJE> {
  const supabase = createServiceClient();

  const dadosInsercao = {
    tipo_entidade: params.tipo_entidade,
    entidade_id: params.entidade_id,
    id_pessoa_pje: params.id_pessoa_pje,
    sistema: params.sistema ?? 'pje_trt',
    tribunal: params.tribunal,
    grau: params.grau ?? null,
    dados_cadastro_pje: (params.dados_cadastro_pje ?? null) as import('@/lib/supabase/database.types').Json,
  };

  const { data, error } = await supabase
    .from('cadastros_pje')
    .upsert(dadosInsercao, {
      onConflict: 'tipo_entidade,id_pessoa_pje,sistema,tribunal,grau',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao fazer upsert de cadastro PJE: ${error.message}`);
  }

  return data as CadastroPJE;
}

/**
 * Busca uma entidade pelo ID da pessoa no PJE
 */
export async function buscarEntidadePorIdPessoaPJE(
  params: BuscarEntidadePorIdPessoaPJEParams
): Promise<CadastroPJE | null> {
  const supabase = createServiceClient();

  let query = supabase
    .from('cadastros_pje')
    .select('*')
    .eq('tipo_entidade', params.tipo_entidade)
    .eq('id_pessoa_pje', params.id_pessoa_pje);

  if (params.sistema) {
    query = query.eq('sistema', params.sistema);
  }

  if (params.tribunal) {
    query = query.eq('tribunal', params.tribunal);
  }

  if (params.grau !== undefined) {
    if (params.grau === null) {
      query = query.is('grau', null);
    } else {
      query = query.eq('grau', params.grau);
    }
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar cadastro PJE: ${error.message}`);
  }

  return data as CadastroPJE | null;
}

