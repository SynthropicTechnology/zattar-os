'use server';

/**
 * PROCESSOS REPOSITORY - Camada de Persistencia
 *
 * Este arquivo contem funcoes de acesso ao banco de dados para Processos.
 * Suporta todos os 19 filtros identificados na UI.
 *
 * CONVENCOES:
 * - Funcoes assincronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validacao de negocio aqui (apenas persistencia)
 * - NUNCA importar React/Next.js aqui
 */

import { createDbClient } from "@/lib/supabase";
import { type DbClient } from "@/lib/supabase/db-client";
import { Result, ok, err, appError } from "@/types";
import type {
  Processo,
  ProcessoUnificado,
  Movimentacao,
  CreateProcessoInput,
  UpdateProcessoInput,
  ListarProcessosParams,
  OrigemAcervo,
  GrauProcesso,
} from "./domain";
import { StatusProcesso } from "./domain";
import { mapCodigoStatusToEnum } from "./domain";
import {
  getProcessoColumnsFull,
  getProcessoUnificadoColumns,
} from "./domain";
import {
  withCache,
  generateCacheKey,
  CACHE_PREFIXES,
  getCached,
  setCached,
  deleteCached,
} from "@/lib/redis/cache-utils";
import { invalidateAcervoCache } from "@/lib/redis/invalidation";
import { logQuery } from "@/lib/supabase/query-logger";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_ACERVO = "acervo";
const TABLE_ADVOGADOS = "advogados";
const TABLE_USUARIOS = "usuarios";
const TABLE_TRIBUNAIS = "tribunais";

type ListResult<T, E = ReturnType<typeof appError>> =
  | { success: true; data: T[]; total: number }
  | { success: false; error: E };

function mapOrdenarPorToSnake(ordenarPor: string): string {
  const map: Record<string, string> = {
    dataAutuacao: "data_autuacao",
    dataArquivamento: "data_arquivamento",
    dataProximaAudiencia: "data_proxima_audiencia",
    numeroProcesso: "numero_processo",
    nomeParteAutora: "nome_parte_autora",
    nomeParteRe: "nome_parte_re",
    codigoStatusProcesso: "codigo_status_processo",
    createdAt: "created_at",
    updatedAt: "updated_at",
  };

  return map[ordenarPor] ?? ordenarPor;
}

function isChainable(value: unknown): value is { eq: (...args: unknown[]) => unknown } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).eq === "function"
  );
}

// =============================================================================
// CONVERSORES
// =============================================================================

/**
 * Converte dados do banco (snake_case) para entidade Processo (camelCase)
 */
function converterParaProcesso(data: Record<string, unknown>): Processo {
  const codigoStatus = (data.codigo_status_processo as string) || "";

  return {
    id: data.id as number,
    idPje: data.id_pje as number,
    advogadoId: data.advogado_id as number,
    origem: data.origem as OrigemAcervo,
    trt: data.trt as string,
    grau: data.grau as GrauProcesso,
    numeroProcesso: data.numero_processo as string,
    numero: data.numero as number,
    descricaoOrgaoJulgador: data.descricao_orgao_julgador as string,
    classeJudicial: data.classe_judicial as string,
    segredoJustica: (data.segredo_justica as boolean) ?? false,
    codigoStatusProcesso: codigoStatus,
    prioridadeProcessual: (data.prioridade_processual as number) ?? 0,
    nomeParteAutora: data.nome_parte_autora as string,
    qtdeParteAutora: (data.qtde_parte_autora as number) ?? 1,
    nomeParteRe: data.nome_parte_re as string,
    qtdeParteRe: (data.qtde_parte_re as number) ?? 1,
    dataAutuacao: data.data_autuacao as string,
    juizoDigital: (data.juizo_digital as boolean) ?? false,
    dataArquivamento: (data.data_arquivamento as string | null) ?? null,
    dataProximaAudiencia:
      (data.data_proxima_audiencia as string | null) ?? null,
    temAssociacao: (data.tem_associacao as boolean) ?? false,
    responsavelId: (data.responsavel_id as number | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    // Campo derivado
    status: mapCodigoStatusToEnum(codigoStatus),
  };
}

interface DbInstancia {
  id: number;
  trt: string;
  grau: GrauProcesso;
  origem: OrigemAcervo;
  updated_at: string;
  data_autuacao: string;
  is_grau_atual: boolean;
  status: string | null;
}

interface DbProcessoUnificadoResult {
  id: number;
  id_pje: number;
  advogado_id: number;
  trt: string;
  numero_processo: string;
  numero: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  segredo_justica: boolean;
  codigo_status_processo: string;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string;
  juizo_digital: boolean;
  data_arquivamento: string | null;
  data_proxima_audiencia: string | null;
  tem_associacao: boolean;
  responsavel_id: number | null;
  created_at: string;
  updated_at: string;
  status: string | null;
  origem: string | null;
  grau_atual: GrauProcesso;
  graus_ativos: GrauProcesso[];
  instances: DbInstancia[];
  // Fonte da verdade (1º grau)
  trt_origem: string | null;
  nome_parte_autora_origem: string | null;
  nome_parte_re_origem: string | null;
  data_autuacao_origem: string | null;
  orgao_julgador_origem: string | null;
  grau_origem: GrauProcesso | null;
}

// =============================================================================
// FUNCOES DE LEITURA
// =============================================================================

/**
 * Busca um processo pelo ID
 */
export async function findProcessoById(
  id: number,
  client?: DbClient
): Promise<Result<Processo | null>> {
  try {
    const db = client || createDbClient();

    const { data, error } = await logQuery(
      "processos.findProcessoById",
      async () => {
        const result = await db
          .from(TABLE_ACERVO)
          .select(getProcessoColumnsFull())
          .eq("id", id)
          .single();
        return result;
      }
    );

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaProcesso(data as unknown as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar processo",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca um processo unificado pelo ID
 * Usa a view acervo_unificado para retornar dados unificados com fonte da verdade
 */
export async function findProcessoUnificadoById(
  id: number,
  client?: DbClient
): Promise<Result<ProcessoUnificado | null>> {
  try {
    const cacheKey = `${CACHE_PREFIXES.acervo}:unificado:${id}`;
    const cached = await getCached<ProcessoUnificado>(cacheKey);
    if (cached) return ok(cached);

    const db = client || createDbClient();

    const { data, error } = await logQuery(
      "processos.findProcessoUnificadoById",
      async () => {
        const result = await db
          .from("acervo_unificado")
          .select(getProcessoUnificadoColumns())
          .eq("id", id)
          .single();
        return result;
      }
    );

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const row = data as unknown as DbProcessoUnificadoResult;
    
    // Mapear para ProcessoUnificado (mesma lógica de findAllProcessos)
    const processo: ProcessoUnificado = {
      id: row.id,
      idPje: row.id_pje,
      advogadoId: row.advogado_id,
      trt: row.trt,
      numeroProcesso: row.numero_processo,
      numero: row.numero,
      descricaoOrgaoJulgador: row.descricao_orgao_julgador,
      classeJudicial: row.classe_judicial,
      segredoJustica: row.segredo_justica,
      codigoStatusProcesso: row.codigo_status_processo,
      prioridadeProcessual: row.prioridade_processual,
      nomeParteAutora: row.nome_parte_autora,
      qtdeParteAutora: row.qtde_parte_autora,
      nomeParteRe: row.nome_parte_re,
      qtdeParteRe: row.qtde_parte_re,
      dataAutuacao: row.data_autuacao,
      juizoDigital: row.juizo_digital,
      dataArquivamento: row.data_arquivamento,
      dataProximaAudiencia: row.data_proxima_audiencia,
      temAssociacao: row.tem_associacao,
      responsavelId: row.responsavel_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status
        ? (row.status as StatusProcesso)
        : StatusProcesso.ATIVO,
      origem: (row.origem as OrigemAcervo) || "acervo_geral",
      grauAtual: row.grau_atual,
      grausAtivos: row.graus_ativos,
      instances: Array.isArray(row.instances)
        ? row.instances.map((inst) => ({
            id: inst.id,
            trt: inst.trt,
            grau: inst.grau,
            origem: inst.origem,
            updatedAt: inst.updated_at,
            dataAutuacao: inst.data_autuacao,
            isGrauAtual: inst.is_grau_atual,
            status: (inst.status as StatusProcesso) || StatusProcesso.ATIVO,
          }))
        : [],
      // FONTE DA VERDADE (dados do 1º grau) - manter undefined quando ausente
      trtOrigem: row.trt_origem ?? undefined,
      nomeParteAutoraOrigem: row.nome_parte_autora_origem ?? undefined,
      nomeParteReOrigem: row.nome_parte_re_origem ?? undefined,
      dataAutuacaoOrigem: row.data_autuacao_origem ?? undefined,
      orgaoJulgadorOrigem: row.orgao_julgador_origem ?? undefined,
      grauOrigem: row.grau_origem ?? undefined,
    };

    await setCached(cacheKey, processo, 600);
    return ok(processo);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar processo unificado",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista processos com filtros e paginacao (suporta 19 filtros)
 *
 * Ordem de aplicacao dos filtros (performance):
 * 1. Filtros indexados (advogado_id, origem, trt, grau_atual, numero_processo)
 * 2. Filtros de texto (ilike)
 * 3. Filtros booleanos
 * 4. Filtros de data (ranges)
 * 5. Busca geral (mais custoso)
 */
export async function findAllProcessos(
  params: ListarProcessosParams = {},
  client?: DbClient
): Promise<ListResult<ProcessoUnificado>> {
  try {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.acervo, params as Record<string, unknown>);
    
    const executeQuery = async (): Promise<ListResult<ProcessoUnificado>> => {
      const db = client || createDbClient();

      const pagina = params.pagina ?? 1;
      const limite = params.limite ?? 50;
      const offset = (pagina - 1) * limite;

        let query = db.from("acervo_unificado").select(getProcessoUnificadoColumns(), { count: "exact" });

        // =======================================================================
        // FILTROS INDEXADOS (aplicar primeiro para performance)
        // =======================================================================

        if (params.advogadoId !== undefined) {
          query = query.eq("advogado_id", params.advogadoId);
        }

        if (params.origem !== undefined) {
          query = query.eq("origem", params.origem);
        }

        if (params.trt !== undefined) {
          if (Array.isArray(params.trt)) {
            query = query.in("trt", params.trt);
          } else {
            query = query.eq("trt", params.trt);
          }
        }

        if (params.grau !== undefined) {
          query = query.eq("grau_atual", params.grau);
        }

        if (params.numeroProcesso !== undefined) {
          query = query.eq("numero_processo", params.numeroProcesso);
        }

        if (params.responsavelId !== undefined) {
          query = query.eq("responsavel_id", params.responsavelId);
        }

        // =======================================================================
        // FILTROS DE TEXTO (ilike para busca parcial)
        // =======================================================================

        if (params.nomeParteAutora !== undefined && params.nomeParteAutora.trim()) {
          query = query.ilike(
            "nome_parte_autora",
            `%${params.nomeParteAutora.trim()}%`
          );
        }

        if (params.nomeParteRe !== undefined && params.nomeParteRe.trim()) {
          query = query.ilike("nome_parte_re", `%${params.nomeParteRe.trim()}%`);
        }

        if (
          params.descricaoOrgaoJulgador !== undefined &&
          params.descricaoOrgaoJulgador.trim()
        ) {
          query = query.ilike(
            "descricao_orgao_julgador",
            `%${params.descricaoOrgaoJulgador.trim()}%`
          );
        }

        if (params.classeJudicial !== undefined && params.classeJudicial.trim()) {
          query = query.ilike(
            "classe_judicial",
            `%${params.classeJudicial.trim()}%`
          );
        }

        if (
          params.codigoStatusProcesso !== undefined &&
          params.codigoStatusProcesso.trim()
        ) {
          query = query.eq(
            "codigo_status_processo",
            params.codigoStatusProcesso.trim()
          );
        }

        // =======================================================================
        // FILTROS BOOLEANOS
        // =======================================================================

        if (params.segredoJustica !== undefined) {
          query = query.eq("segredo_justica", params.segredoJustica);
        }

        if (params.juizoDigital !== undefined) {
          query = query.eq("juizo_digital", params.juizoDigital);
        }

        if (params.temAssociacao !== undefined) {
          query = query.eq("tem_associacao", params.temAssociacao);
        }

        if (params.temProximaAudiencia === true) {
          query = query.not("data_proxima_audiencia", "is", null);
        }

        if (params.semResponsavel === true) {
          query = query.is("responsavel_id", null);
        }

        // =======================================================================
        // FILTROS DE DATA (ranges)
        // =======================================================================

        if (params.dataAutuacaoInicio !== undefined) {
          query = query.gte("data_autuacao", params.dataAutuacaoInicio);
        }

        if (params.dataAutuacaoFim !== undefined) {
          query = query.lte("data_autuacao", params.dataAutuacaoFim);
        }

        if (params.dataArquivamentoInicio !== undefined) {
          query = query.gte("data_arquivamento", params.dataArquivamentoInicio);
        }

        if (params.dataArquivamentoFim !== undefined) {
          query = query.lte("data_arquivamento", params.dataArquivamentoFim);
        }

        if (params.dataProximaAudienciaInicio !== undefined) {
          query = query.gte(
            "data_proxima_audiencia",
            params.dataProximaAudienciaInicio
          );
        }

        if (params.dataProximaAudienciaFim !== undefined) {
          query = query.lte(
            "data_proxima_audiencia",
            params.dataProximaAudienciaFim
          );
        }

        // =======================================================================
        // FILTROS DE RELACIONAMENTO (via JOIN com processo_partes)
        // =======================================================================

        if (params.clienteId !== undefined) {
          // Busca processos vinculados ao cliente via processo_partes
          const { data: processosVinculados, error: vinculoError } = (await db
            .from("processo_partes")
            .select("processo_id")
            .eq("tipo_entidade", "cliente")
            .eq("entidade_id", params.clienteId)) as {
            data?: unknown;
            error?: unknown;
          };

          if (vinculoError) {
            const message =
              typeof vinculoError === "object" && vinculoError && "message" in vinculoError
                ? String((vinculoError as { message: unknown }).message)
                : "Erro ao buscar vínculos";
            const code =
              typeof vinculoError === "object" && vinculoError && "code" in vinculoError
                ? String((vinculoError as { code: unknown }).code)
                : undefined;

            return {
              success: false,
              error: appError("DATABASE_ERROR", message, {
                code,
              }),
            } as ListResult<ProcessoUnificado>;
          }

          const vinculosArr = Array.isArray(processosVinculados)
            ? (processosVinculados as unknown[])
            : [];

          if (vinculosArr.length === 0) {
            // Nenhum processo vinculado - retornar lista vazia
            return { success: true, data: [], total: 0 };
          }

          const processoIds = vinculosArr
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const value = (row as { processo_id?: unknown }).processo_id;
              return typeof value === "number" ? value : null;
            })
            .filter((v): v is number => typeof v === "number");

          if (processoIds.length === 0) {
            return { success: true, data: [], total: 0 };
          }

          query = query.in("id", processoIds);
        }

        // =======================================================================
        // BUSCA GERAL (mais custoso - aplicar por ultimo)
        // =======================================================================

        if (params.busca !== undefined && params.busca.trim()) {
          const busca = params.busca.trim();
          // Busca em multiplos campos usando OR
          query = query.or(
            `numero_processo.ilike.%${busca}%,` +
              `nome_parte_autora.ilike.%${busca}%,` +
              `nome_parte_re.ilike.%${busca}%,` +
              `descricao_orgao_julgador.ilike.%${busca}%`
          );
        }

        // =======================================================================
        // ORDENACAO
        // =======================================================================

        const ordenarPor = mapOrdenarPorToSnake(params.ordenarPor ?? "data_autuacao");
        const ordem = params.ordem ?? "desc";
        query = query.order(ordenarPor, { ascending: ordem === "asc", nullsFirst: false });

        // =======================================================================
        // PAGINACAO
        // =======================================================================

        query = query.range(offset, offset + limite - 1);

        // =======================================================================
        // EXECUCAO
        // =======================================================================

        const { data, error, count } = await query;

        if (error) {
          return {
            success: false,
            error: appError("DATABASE_ERROR", error.message, { code: error.code }),
          } as ListResult<ProcessoUnificado>;
        }

        // A view ja retorna os dados unificados
        // Mapeamento manual para garantir camelCase e tipos corretos
        const processos: ProcessoUnificado[] = (
          (data as unknown as DbProcessoUnificadoResult[]) || []
        ).map((row) => ({
          id: row.id,
          idPje: row.id_pje,
          advogadoId: row.advogado_id,
          trt: row.trt,
          numeroProcesso: row.numero_processo,
          numero: row.numero,
          descricaoOrgaoJulgador: row.descricao_orgao_julgador,
          classeJudicial: row.classe_judicial,
          segredoJustica: row.segredo_justica,
          codigoStatusProcesso: row.codigo_status_processo,
          prioridadeProcessual: row.prioridade_processual,
          nomeParteAutora: row.nome_parte_autora,
          qtdeParteAutora: row.qtde_parte_autora,
          nomeParteRe: row.nome_parte_re,
          qtdeParteRe: row.qtde_parte_re,
          dataAutuacao: row.data_autuacao,
          juizoDigital: row.juizo_digital,
          dataArquivamento: row.data_arquivamento,
          dataProximaAudiencia: row.data_proxima_audiencia,
          temAssociacao: row.tem_associacao,
          responsavelId: row.responsavel_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          status: row.status
            ? (row.status as StatusProcesso)
            : StatusProcesso.ATIVO,
          origem: (row.origem as OrigemAcervo) || "acervo_geral",
          grauAtual: row.grau_atual,
          grausAtivos: row.graus_ativos,
          instances: Array.isArray(row.instances)
            ? row.instances.map((inst: DbInstancia) => ({
                id: inst.id,
                trt: inst.trt,
                grau: inst.grau,
                origem: inst.origem,
                updatedAt: inst.updated_at,
                dataAutuacao: inst.data_autuacao,
                isGrauAtual: inst.is_grau_atual,
                status: (inst.status as StatusProcesso) || StatusProcesso.ATIVO,
              }))
            : [],
          // FONTE DA VERDADE (dados do 1º grau) - manter null quando ausente
          trtOrigem: row.trt_origem ?? undefined,
          nomeParteAutoraOrigem: row.nome_parte_autora_origem ?? undefined,
          nomeParteReOrigem: row.nome_parte_re_origem ?? undefined,
          dataAutuacaoOrigem: row.data_autuacao_origem ?? undefined,
          orgaoJulgadorOrigem: row.orgao_julgador_origem ?? undefined,
          grauOrigem: row.grau_origem ?? undefined,
        }));

        return { success: true, data: processos, total: count ?? 0 };
      };
      
      return await withCache(cacheKey, executeQuery, 300);
  } catch (error) {
    const errorObj = appError(
      "DATABASE_ERROR",
      "Erro ao listar processos",
      undefined,
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: errorObj,
    } as ListResult<ProcessoUnificado>;
  }
}

/**
 * Busca timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Implementacao futura na Fase 4 (Integracao PJE)
 */
export async function findTimelineByProcessoId(
  processoId: number,
  client?: DbClient
): Promise<Result<Movimentacao[]>> {
  try {
    const processoResult = await findProcessoById(processoId, client);
    if (!processoResult.success) {
      return err(processoResult.error);
    }

    const processo = processoResult.data;
    if (!processo) {
      return err(appError("NOT_FOUND", `Processo com ID ${processoId} nao encontrado`));
    }

    const db = client || createDbClient();

    const { data: acervo, error: acervoError } = (await db
      .from(TABLE_ACERVO)
      .select("timeline_jsonb")
      .eq("id_pje", processo.idPje)
      .eq("trt", processo.trt)
      .eq("grau", processo.grau)
      .maybeSingle()) as { data?: unknown; error?: unknown };

    if (acervoError) {
      const message =
        typeof acervoError === "object" && acervoError && "message" in acervoError
          ? String((acervoError as { message: unknown }).message)
          : "Erro ao buscar timeline";
      const code =
        typeof acervoError === "object" && acervoError && "code" in acervoError
          ? String((acervoError as { code: unknown }).code)
          : undefined;

      return err(appError("DATABASE_ERROR", message, { code }));
    }

    const acervoObj = acervo && typeof acervo === "object" ? (acervo as Record<string, unknown>) : null;
    const timelineJsonb = (acervoObj?.timeline_jsonb as unknown) ?? null;
    const timelineArr: unknown[] = Array.isArray(timelineJsonb)
      ? timelineJsonb
      : ((timelineJsonb as { timeline?: unknown[] } | null)?.timeline ?? []);

    if (timelineArr.length === 0) {
      return ok([]);
    }

    const createdAtFromPayload = !Array.isArray(timelineJsonb)
      ? (timelineJsonb as { metadata?: { capturadoEm?: string } } | null)?.metadata
          ?.capturadoEm
      : undefined;

    const createdAt = createdAtFromPayload
      ? new Date(createdAtFromPayload).toISOString()
      : new Date().toISOString();

    const movimentacoes: Movimentacao[] = timelineArr.map((item) => {
      const itemObj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

      const tipoFromLegacy =
        typeof itemObj.tipo_movimentacao === "string" ? itemObj.tipo_movimentacao : undefined;

      const metadataObj =
        itemObj.metadata && typeof itemObj.metadata === "object"
          ? (itemObj.metadata as Record<string, unknown>)
          : undefined;

      const capturadoEm =
        typeof metadataObj?.capturado_em === "string" ? metadataObj.capturado_em : undefined;
      const tituloFromMetadata =
        typeof metadataObj?.titulo === "string" ? metadataObj.titulo : undefined;

      const createdAtItem = capturadoEm
        ? new Date(capturadoEm).toISOString()
        : createdAt;

      const hasDocumento = typeof itemObj.documento !== "undefined" && itemObj.documento !== null;
      const tipoMovimentacao = tipoFromLegacy ?? (hasDocumento ? "documento" : "movimento");
      const descricao =
        tituloFromMetadata ?? (typeof itemObj.titulo === "string" ? itemObj.titulo : "");

      const dataMov = typeof itemObj.data === "string" ? itemObj.data : createdAtItem;

      return {
        id: typeof itemObj.id === "number" ? itemObj.id : 0,
        processoId,
        dataMovimentacao: dataMov,
        tipoMovimentacao,
        descricao,
        dadosPjeCompleto: item as unknown as Record<string, unknown>,
        createdAt: createdAtItem,
      };
    });

    return ok(movimentacoes);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar timeline do processo",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNCOES DE VALIDACAO DE RELACIONAMENTOS
// =============================================================================

/**
 * Verifica se um advogado existe
 */
export async function advogadoExists(
  advogadoId: number,
  client?: DbClient
): Promise<Result<boolean>> {
  try {
    const db = client || createDbClient();

    const { data, error } = await db
      .from(TABLE_ADVOGADOS)
      .select("id")
      .eq("id", advogadoId)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar advogado",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se um usuario (responsavel) existe
 */
export async function usuarioExists(
  usuarioId: number,
  client?: DbClient
): Promise<Result<boolean>> {
  try {
    const db = client || createDbClient();

    const { data, error } = await db
      .from(TABLE_USUARIOS)
      .select("id")
      .eq("id", usuarioId)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar usuario",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista todos os tribunais ativos
 */
export async function findAllTribunais(
  client?: DbClient
): Promise<
  Result<Array<{ codigo: string; nome: string }>>
> {
  try {
    const db = client || createDbClient();

    const baseQuery = db.from(TABLE_TRIBUNAIS) as unknown;
    const selectFn = (baseQuery as { select?: (cols: string) => unknown }).select;
    const selection = typeof selectFn === "function" ? selectFn.call(baseQuery, "codigo, nome") : baseQuery;

    const chainTarget = isChainable(selection) ? selection : baseQuery;
    const eqFn = (chainTarget as { eq?: (col: string, value: unknown) => unknown }).eq;
    const orderFn = (chainTarget as { order?: (col: string) => unknown }).order;
    if (typeof eqFn === "function") eqFn.call(chainTarget, "ativo", true);
    if (typeof orderFn === "function") orderFn.call(chainTarget, "codigo");

    const response = (isChainable(selection) ? await chainTarget : await selection) as {
      data?: unknown;
      error?: unknown;
    };
    const { data, error } = response;

    if (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : undefined;
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "Erro ao listar tribunais";

      if (code === "42P01") {
        // Tabela nao existe (caso de dev)
        console.warn("Tabela tribunais nao encontrada, retornando lista vazia");
        return ok([]);
      }
      return err(
        appError("DATABASE_ERROR", message, { code })
      );
    }

    const rows = Array.isArray(data) ? (data as unknown[]) : [];
    const mapped = rows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const obj = row as Record<string, unknown>;
        const codigo = typeof obj.codigo === "string" ? obj.codigo : "";
        const nome = typeof obj.nome === "string" ? obj.nome : "";
        if (!codigo || !nome) return null;
        return { codigo, nome };
      })
      .filter((t): t is { codigo: string; nome: string } => !!t);

    return ok(mapped);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar tribunais",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNCOES DE ESCRITA
// =============================================================================

/**
 * Cria um novo processo no banco
 */
export async function saveProcesso(
  input: CreateProcessoInput,
  client?: DbClient
): Promise<Result<Processo>> {
  try {
    const db = client || createDbClient();

    // Preparar dados para insercao (camelCase -> snake_case)
    const dadosInsercao: Record<string, unknown> = {
      id_pje: input.idPje,
      advogado_id: input.advogadoId,
      origem: input.origem,
      trt: input.trt,
      grau: input.grau,
      numero_processo: input.numeroProcesso,
      numero: input.numero,
      descricao_orgao_julgador: input.descricaoOrgaoJulgador,
      classe_judicial: input.classeJudicial,
      codigo_status_processo: input.codigoStatusProcesso,
      nome_parte_autora: input.nomeParteAutora,
      nome_parte_re: input.nomeParteRe,
      data_autuacao: input.dataAutuacao,
      segredo_justica: input.segredoJustica ?? false,
      juizo_digital: input.juizoDigital ?? false,
      tem_associacao: input.temAssociacao ?? false,
      prioridade_processual: input.prioridadeProcessual ?? 0,
      qtde_parte_autora: input.qtdeParteAutora ?? 1,
      qtde_parte_re: input.qtdeParteRe ?? 1,
      data_arquivamento: input.dataArquivamento ?? null,
      data_proxima_audiencia: input.dataProximaAudiencia ?? null,
      responsavel_id: input.responsavelId ?? null,
    };

    const { data, error } = await db
      .from(TABLE_ACERVO)
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      // Tratar erro de constraint (processo duplicado)
      if (error.code === "23505") {
        return err(
          appError("CONFLICT", "Processo ja existe com estes dados", {
            code: error.code,
            constraint: error.details,
          })
        );
      }
      return err(
        appError("DATABASE_ERROR", `Erro ao criar processo: ${error.message}`, {
          code: error.code,
        })
      );
    }

    const resultado = converterParaProcesso(data as Record<string, unknown>);

    // Refresh da materialized view para refletir a inserção
    const rpcInsertResult = await db.rpc("refresh_acervo_unificado", { use_concurrent: true });
    if (rpcInsertResult.error) {
      console.warn("[createProcesso] Falha no refresh concorrente da view:", rpcInsertResult.error.message);
      const retryInsertResult = await db.rpc("refresh_acervo_unificado", { use_concurrent: false });
      if (retryInsertResult.error) {
        console.error("[createProcesso] Falha no retry do refresh da view:", retryInsertResult.error.message);
      }
    }

    await invalidateAcervoCache();
    return ok(resultado);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar processo",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza um processo existente
 */
export async function updateProcesso(
  id: number,
  input: UpdateProcessoInput,
  _processoExistente: Processo,
  client?: DbClient
): Promise<Result<Processo>> {
  try {
    const db = client || createDbClient();

    // Preparar dados para atualizacao (apenas campos fornecidos)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.idPje !== undefined) {
      dadosAtualizacao.id_pje = input.idPje;
    }
    if (input.advogadoId !== undefined) {
      dadosAtualizacao.advogado_id = input.advogadoId;
    }
    if (input.origem !== undefined) {
      dadosAtualizacao.origem = input.origem;
    }
    if (input.trt !== undefined) {
      dadosAtualizacao.trt = input.trt;
    }
    if (input.grau !== undefined) {
      dadosAtualizacao.grau = input.grau;
    }
    if (input.numeroProcesso !== undefined) {
      dadosAtualizacao.numero_processo = input.numeroProcesso;
    }
    if (input.numero !== undefined) {
      dadosAtualizacao.numero = input.numero;
    }
    if (input.descricaoOrgaoJulgador !== undefined) {
      dadosAtualizacao.descricao_orgao_julgador = input.descricaoOrgaoJulgador;
    }
    if (input.classeJudicial !== undefined) {
      dadosAtualizacao.classe_judicial = input.classeJudicial;
    }
    if (input.codigoStatusProcesso !== undefined) {
      dadosAtualizacao.codigo_status_processo = input.codigoStatusProcesso;
    }
    if (input.nomeParteAutora !== undefined) {
      dadosAtualizacao.nome_parte_autora = input.nomeParteAutora;
    }
    if (input.nomeParteRe !== undefined) {
      dadosAtualizacao.nome_parte_re = input.nomeParteRe;
    }
    if (input.dataAutuacao !== undefined) {
      dadosAtualizacao.data_autuacao = input.dataAutuacao;
    }
    if (input.segredoJustica !== undefined) {
      dadosAtualizacao.segredo_justica = input.segredoJustica;
    }
    if (input.juizoDigital !== undefined) {
      dadosAtualizacao.juizo_digital = input.juizoDigital;
    }
    if (input.temAssociacao !== undefined) {
      dadosAtualizacao.tem_associacao = input.temAssociacao;
    }
    if (input.prioridadeProcessual !== undefined) {
      dadosAtualizacao.prioridade_processual = input.prioridadeProcessual;
    }
    if (input.qtdeParteAutora !== undefined) {
      dadosAtualizacao.qtde_parte_autora = input.qtdeParteAutora;
    }
    if (input.qtdeParteRe !== undefined) {
      dadosAtualizacao.qtde_parte_re = input.qtdeParteRe;
    }
    if (input.dataArquivamento !== undefined) {
      dadosAtualizacao.data_arquivamento = input.dataArquivamento;
    }
    if (input.dataProximaAudiencia !== undefined) {
      dadosAtualizacao.data_proxima_audiencia = input.dataProximaAudiencia;
    }
    if (input.responsavelId !== undefined) {
      dadosAtualizacao.responsavel_id = input.responsavelId;
    }

    const { data, error } = await db
      .from(TABLE_ACERVO)
      .update(dadosAtualizacao)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar processo: ${error.message}`,
          {
            code: error.code,
          }
        )
      );
    }

    if (!data) {
      return err(
        appError(
          "NOT_FOUND",
          `Processo com ID ${id} não encontrado na tabela acervo`
        )
      );
    }

    const resultado = converterParaProcesso(data as Record<string, unknown>);

    // Refresh da materialized view para refletir a atualização
    const rpcResult = await db.rpc("refresh_acervo_unificado", { use_concurrent: true });
    if (rpcResult.error) {
      console.warn("[updateProcesso] Falha no refresh concorrente da view:", rpcResult.error.message);
      // Retry sem CONCURRENTLY (mais confiável, mas bloqueia leituras momentaneamente)
      const retryResult = await db.rpc("refresh_acervo_unificado", { use_concurrent: false });
      if (retryResult.error) {
        console.error("[updateProcesso] Falha no retry do refresh da view:", retryResult.error.message);
      }
    }

    await deleteCached(`${CACHE_PREFIXES.acervo}:unificado:${id}`);
    await invalidateAcervoCache();
    return ok(resultado);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar processo",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
