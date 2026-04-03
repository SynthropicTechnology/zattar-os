/**
 * Repository para vínculos processo-partes
 * Funções de persistência para vincular entidades (clientes, partes contrárias, terceiros) a processos
 */

import { createServiceClient } from "@/lib/supabase/service-client";
import { createDbClient } from "@/lib/supabase";
import { fromCamelToSnake, fromSnakeToCamel } from "@/lib/utils";
import type {
  TipoParteProcesso,
  PoloProcessoParte,
} from "@/app/(authenticated)/partes";

// =============================================================================
// API compatível com testes (createDbClient + Result {success,data,error})
// =============================================================================

export type ProcessoParteEntidadeTipo = "cliente" | "parte_contraria" | "terceiro";
export type ProcessoParteTipoParticipacao =
  | "autor"
  | "reu"
  | "terceiro_interessado";

export type ProcessoPartesRepositoryError = {
  code: "CONFLICT" | "DB_ERROR";
  message: string;
  cause?: unknown;
};

export type ProcessoPartesRepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: ProcessoPartesRepositoryError };

export type VincularParteAoProcessoInput = {
  processoId: number;
  entidadeTipo: ProcessoParteEntidadeTipo;
  entidadeId: number;
  tipoParticipacao: ProcessoParteTipoParticipacao;
};

export async function vincularParteAoProcesso(
  input: VincularParteAoProcessoInput
): Promise<ProcessoPartesRepositoryResult<unknown>> {
  const supabase = createDbClient();
  const payload = fromCamelToSnake(input);

  const { data, error } = await supabase
    .from("processo_partes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: error.message,
          cause: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error.message,
        cause: error,
      },
    };
  }

  return { success: true, data: fromSnakeToCamel(data) };
}

export async function listarPartesDoProcesso(
  processoId: number,
  entidadeTipo?: ProcessoParteEntidadeTipo,
  tipoParticipacao?: ProcessoParteTipoParticipacao
): Promise<ProcessoPartesRepositoryResult<unknown[]>> {
  const supabase = createDbClient();
  let query = supabase.from("processo_partes").select("*");

  query = query.eq("processo_id", processoId);
  if (entidadeTipo) query = query.eq("entidade_tipo", entidadeTipo);
  if (tipoParticipacao) query = query.eq("tipo_participacao", tipoParticipacao);

  const { data, error } = await query;
  if (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error.message, cause: error },
    };
  }

  return { success: true, data: (data ?? []).map((row) => fromSnakeToCamel(row)) };
}

export async function listarProcessosDaParte(
  entidadeTipo: ProcessoParteEntidadeTipo,
  entidadeId: number,
  tipoParticipacao?: ProcessoParteTipoParticipacao
): Promise<ProcessoPartesRepositoryResult<unknown[]>> {
  const supabase = createDbClient();
  let query = supabase.from("processo_partes").select("*");

  query = query.eq("entidade_tipo", entidadeTipo);
  query = query.eq("entidade_id", entidadeId);
  if (tipoParticipacao) query = query.eq("tipo_participacao", tipoParticipacao);

  const { data, error } = await query;
  if (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error.message, cause: error },
    };
  }

  return { success: true, data: (data ?? []).map((row) => fromSnakeToCamel(row)) };
}

export async function desvincularParteDoProcesso(
  vinculoId: number
): Promise<ProcessoPartesRepositoryResult<null>> {
  const supabase = createDbClient();
  let query = supabase.from("processo_partes").delete();

  query = query.eq("id", vinculoId);
  const { error } = await query;

  if (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error.message, cause: error },
    };
  }
  return { success: true, data: null };
}

export async function atualizarVinculoProcessoParte(
  vinculoId: number,
  updates: Partial<Pick<VincularParteAoProcessoInput, "tipoParticipacao">>
): Promise<ProcessoPartesRepositoryResult<unknown>> {
  const supabase = createDbClient();
  const payload = fromCamelToSnake(updates);

  const { data, error } = await supabase
    .from("processo_partes")
    .update(payload)
    .eq("id", vinculoId)
    .select("*")
    .single();

  if (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error.message, cause: error },
    };
  }

  return { success: true, data: fromSnakeToCamel(data) };
}

export async function buscarVinculoPorId(
  vinculoId: number
): Promise<ProcessoPartesRepositoryResult<unknown | null>> {
  const supabase = createDbClient();

  const { data, error } = await supabase
    .from("processo_partes")
    .select("*")
    .eq("id", vinculoId)
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") {
      return { success: true, data: null };
    }
    return {
      success: false,
      error: { code: "DB_ERROR", message: error.message, cause: error },
    };
  }

  return { success: true, data: fromSnakeToCamel(data) };
}

export interface VincularParteProcessoParams {
  processo_id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje?: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: "primeiro_grau" | "segundo_grau" | "tribunal_superior" | "1" | "2";
  numero_processo: string;
  principal?: boolean;
  ordem?: number;
  dados_pje_completo?: Record<string, unknown> | null;
}

export interface ProcessoParte {
  id: number;
  processo_id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  dados_pje_completo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VincularParteProcessoResult {
  sucesso: boolean;
  processoParte?: ProcessoParte;
  erro?: string;
}

/**
 * Vincula uma entidade (cliente, parte contrária ou terceiro) a um processo
 */
export async function vincularParteProcesso(
  params: VincularParteProcessoParams
): Promise<VincularParteProcessoResult> {
  try {
    const supabase = createServiceClient();

    // Normalizar grau
    const grauNormalizado =
      params.grau === "1"
        ? "primeiro_grau"
        : params.grau === "2"
        ? "segundo_grau"
        : params.grau;

    const dadosInsercao = {
      processo_id: params.processo_id,
      tipo_entidade: params.tipo_entidade,
      entidade_id: params.entidade_id,
      id_pje: params.id_pje,
      id_pessoa_pje: params.id_pessoa_pje ?? null,
      tipo_parte: params.tipo_parte,
      polo: params.polo,
      trt: params.trt,
      grau: grauNormalizado,
      numero_processo: params.numero_processo,
      principal: params.principal ?? false,
      ordem: params.ordem ?? 0,
      dados_pje_completo: (params.dados_pje_completo ?? null) as import('@/lib/supabase/database.types').Json,
    };

    const { data, error } = await supabase
      .from("processo_partes")
      .upsert(dadosInsercao, {
        onConflict: "processo_id,tipo_entidade,entidade_id,grau",
      })
      .select()
      .single();

    if (error) {
      // Verificar se é erro de constraint única (já existe)
      if (error.code === "23505") {
        return {
          sucesso: false,
          erro: "Vínculo já existe para este processo, entidade e grau",
        };
      }
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    return {
      sucesso: true,
      processoParte: data as ProcessoParte,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao vincular parte ao processo",
    };
  }
}

export interface BuscarProcessosPorEntidadeResult {
  sucesso: boolean;
  processos?: ProcessoParte[];
  erro?: string;
}

export async function buscarProcessosPorEntidade(
  tipoEntidade: "cliente" | "parte_contraria" | "terceiro",
  entidadeId: number
): Promise<BuscarProcessosPorEntidadeResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("processo_partes")
      .select("*")
      .eq("tipo_entidade", tipoEntidade)
      .eq("entidade_id", entidadeId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    return {
      sucesso: true,
      processos: data as ProcessoParte[],
    };
  } catch (error) {
    return {
      sucesso: false,
      erro:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao buscar processos",
    };
  }
}
