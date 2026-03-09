/**
 * COMUNICA CNJ REPOSITORY - Camada de Persistência
 * Operações CRUD na tabela comunica_cnj com pattern Result<T>
 */

import { createServiceClient } from "@/lib/supabase/service-client";
import { toDateString } from "@/lib/date-utils";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import type {
  ComunicacaoCNJ,
  InserirComunicacaoParams,
  ListarComunicacoesParams,
  MatchParams,
  BatchResult,
  MeioComunicacao,
  ComunicacaoDestinatario,
  ComunicacaoDestinatarioAdvogado,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_COMUNICA_CNJ = "comunica_cnj";
const TABLE_EXPEDIENTES = "expedientes";

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaComunicacaoCNJ(
  data: Record<string, unknown>
): ComunicacaoCNJ {
  return {
    id: data.id as number,
    idCnj: data.id_cnj as number,
    hash: data.hash as string,
    numeroComunicacao: data.numero_comunicacao as number | null,
    numeroProcesso: data.numero_processo as string,
    numeroProcessoMascara: data.numero_processo_mascara as string | null,
    siglaTribunal: data.sigla_tribunal as string,
    orgaoId: data.orgao_id as number | null,
    nomeOrgao: data.nome_orgao as string | null,
    tipoComunicacao: data.tipo_comunicacao as string | null,
    tipoDocumento: data.tipo_documento as string | null,
    nomeClasse: data.nome_classe as string | null,
    codigoClasse: data.codigo_classe as string | null,
    meio: data.meio as MeioComunicacao,
    meioCompleto: data.meio_completo as string | null,
    texto: data.texto as string | null,
    link: data.link as string | null,
    dataDisponibilizacao: data.data_disponibilizacao as string,
    ativo: data.ativo as boolean,
    status: data.status as string | null,
    motivoCancelamento: data.motivo_cancelamento as string | null,
    dataCancelamento: data.data_cancelamento as string | null,
    destinatarios: data.destinatarios as ComunicacaoDestinatario[] | null,
    destinatariosAdvogados: data.destinatarios_advogados as
      | ComunicacaoDestinatarioAdvogado[]
      | null,
    expedienteId: data.expediente_id as number | null,
    advogadoId: data.advogado_id as number | null,
    metadados: data.metadados as Record<string, unknown> | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function converterParaBanco(
  data: InserirComunicacaoParams
): Record<string, unknown> {
  return {
    id_cnj: data.idCnj,
    hash: data.hash,
    numero_comunicacao: data.numeroComunicacao ?? null,
    numero_processo: data.numeroProcesso,
    numero_processo_mascara: data.numeroProcessoMascara ?? null,
    sigla_tribunal: data.siglaTribunal,
    orgao_id: data.orgaoId ?? null,
    nome_orgao: data.nomeOrgao ?? null,
    tipo_comunicacao: data.tipoComunicacao ?? null,
    tipo_documento: data.tipoDocumento ?? null,
    nome_classe: data.nomeClasse ?? null,
    codigo_classe: data.codigoClasse ?? null,
    meio: data.meio,
    meio_completo: data.meioCompleto ?? null,
    texto: data.texto ?? null,
    link: data.link ?? null,
    data_disponibilizacao: data.dataDisponibilizacao,
    ativo: data.ativo ?? true,
    status: data.status ?? null,
    motivo_cancelamento: data.motivoCancelamento ?? null,
    data_cancelamento: data.dataCancelamento ?? null,
    destinatarios: data.destinatarios ?? null,
    destinatarios_advogados: data.destinatariosAdvogados ?? null,
    expediente_id: data.expedienteId ?? null,
    advogado_id: data.advogadoId ?? null,
    metadados: data.metadados ?? null,
  };
}

// =============================================================================
// FUNÇÕES DE CONSULTA
// =============================================================================

export async function findComunicacaoByHash(
  hash: string
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*")
      .eq("hash", hash)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar comunicação por hash.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findComunicacaoById(
  id: number
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar comunicação por ID.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findAllComunicacoes(
  params: ListarComunicacoesParams
): Promise<Result<PaginatedResponse<ComunicacaoCNJ>>> {
  try {
    const db = createServiceClient();
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = db.from(TABLE_COMUNICA_CNJ).select("*", { count: "exact" });

    if (params.numeroProcesso) {
      query = query.eq("numero_processo", params.numeroProcesso);
    }

    if (params.siglaTribunal) {
      query = query.eq("sigla_tribunal", params.siglaTribunal);
    }

    if (params.dataInicio) {
      query = query.gte("data_disponibilizacao", params.dataInicio);
    }

    if (params.dataFim) {
      query = query.lte("data_disponibilizacao", params.dataFim);
    }

    if (params.advogadoId) {
      query = query.eq("advogado_id", params.advogadoId);
    }

    if (params.expedienteId) {
      query = query.eq("expediente_id", params.expedienteId);
    }

    if (params.semExpediente) {
      query = query.is("expediente_id", null);
    }

    const { data, error, count } = await query
      .order("data_disponibilizacao", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return ok({
      data: (data ?? []).map(converterParaComunicacaoCNJ),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar comunicações.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function existsComunicacao(
  hash: string
): Promise<Result<boolean>> {
  try {
    const db = createServiceClient();
    const { count, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*", { count: "exact", head: true })
      .eq("hash", hash);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok((count ?? 0) > 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar comunicação.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNÇÕES DE PERSISTÊNCIA
// =============================================================================

export async function saveComunicacao(
  data: InserirComunicacaoParams
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const dadosBanco = converterParaBanco(data);

    const { data: inserted, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .insert(dadosBanco)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        console.log(
          "[comunica-cnj-repository] Comunicação já existe (hash):",
          data.hash
        );
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(inserted));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao salvar comunicação.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function saveComunicacoesBatch(
  comunicacoes: InserirComunicacaoParams[]
): Promise<Result<BatchResult>> {
  let inseridas = 0;
  let duplicadas = 0;
  let erros = 0;

  for (const comunicacao of comunicacoes) {
    const result = await saveComunicacao(comunicacao);
    if (!result.success) {
      erros++;
      console.error(
        "[comunica-cnj-repository] Erro ao inserir comunicação:",
        result.error
      );
    } else if (result.data === null) {
      duplicadas++;
    } else {
      inseridas++;
    }
  }

  return ok({ inseridas, duplicadas, erros });
}

// =============================================================================
// FUNÇÕES DE VINCULAÇÃO
// =============================================================================

export async function vincularExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<Result<ComunicacaoCNJ>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .update({ expediente_id: expedienteId })
      .eq("id", comunicacaoId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", "Comunicação não encontrada."));
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao vincular expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function desvincularExpediente(
  comunicacaoId: number
): Promise<Result<ComunicacaoCNJ>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .update({ expediente_id: null })
      .eq("id", comunicacaoId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", "Comunicação não encontrada."));
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao desvincular expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findExpedienteCorrespondente(
  params: MatchParams
): Promise<Result<number | null>> {
  try {
    const db = createServiceClient();

    // Calcula data limite (3 dias antes)
    const dataDisp = new Date(params.dataDisponibilizacao);
    const dataLimite = new Date(dataDisp);
    dataLimite.setDate(dataLimite.getDate() - 3);

    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .select("id")
      .eq("numero_processo", params.numeroProcesso)
      .eq("trt", params.trt)
      .eq("grau", params.grau)
      .gte("data_criacao_expediente", toDateString(dataLimite))
      .lte("data_criacao_expediente", params.dataDisponibilizacao)
      .is("baixado_em", null) // Não baixado
      .order("data_criacao_expediente", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      console.log(
        "[comunica-cnj-repository] Erro ao buscar expediente:",
        error.message
      );
      return ok(null);
    }

    // Verifica se o expediente já tem comunicação vinculada
    const { count } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*", { count: "exact", head: true })
      .eq("expediente_id", data.id);

    if (count && count > 0) {
      console.log(
        "[comunica-cnj-repository] Expediente já tem comunicação vinculada:",
        data.id
      );
      return ok(null);
    }

    return ok(data.id);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar expediente correspondente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
