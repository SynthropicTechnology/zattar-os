/**
 * CONTRATOS FEATURE - Camada de Persistência
 *
 * Este arquivo contém funções de acesso ao banco de dados para Contratos.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 */

import { createDbClient } from "@/lib/supabase";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import type {
  Contrato,
  ContratoParte,
  ContratoStatusHistorico,
  ContratoProcessoVinculo,
  CreateContratoInput,
  UpdateContratoInput,
  ListarContratosParams,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PapelContratual,
  TipoEntidadeContrato,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_CONTRATOS = "contratos";
const TABLE_CLIENTES = "clientes";
const TABLE_PARTES_CONTRARIAS = "partes_contrarias";
const TABLE_CONTRATO_PARTES = "contrato_partes";
const TABLE_CONTRATO_STATUS_HISTORICO = "contrato_status_historico";

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaContratoParte(
  data: Record<string, unknown>,
): ContratoParte {
  return {
    id: data.id as number,
    contratoId: data.contrato_id as number,
    tipoEntidade: data.tipo_entidade as TipoEntidadeContrato,
    entidadeId: data.entidade_id as number,
    papelContratual: data.papel_contratual as PapelContratual,
    ordem: (data.ordem as number) ?? 0,
    nomeSnapshot: (data.nome_snapshot as string | null) ?? null,
    cpfCnpjSnapshot: (data.cpf_cnpj_snapshot as string | null) ?? null,
    createdAt: data.created_at as string,
  };
}

/**
 * Verifica se uma parte contrária existe
 */
export async function parteContrariaExists(
  parteContrariaId: number,
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select("id")
      .eq("id", parteContrariaId)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar parte contrária",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

function converterParaContratoStatusHistorico(
  data: Record<string, unknown>,
): ContratoStatusHistorico {
  return {
    id: data.id as number,
    contratoId: data.contrato_id as number,
    fromStatus: (data.from_status as StatusContrato | null) ?? null,
    toStatus: data.to_status as StatusContrato,
    changedAt: data.changed_at as string,
    changedBy: (data.changed_by as number | null) ?? null,
    reason: (data.reason as string | null) ?? null,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
    createdAt: data.created_at as string,
  };
}

function converterParaContratoProcessoVinculo(
  data: Record<string, unknown>,
): ContratoProcessoVinculo {
  const processoRaw = (data.acervo as Record<string, unknown> | null) ?? null;

  return {
    id: data.id as number,
    contratoId: data.contrato_id as number,
    processoId: data.processo_id as number,
    createdAt: data.created_at as string,
    processo: processoRaw
      ? {
          id: processoRaw.id as number,
          numeroProcesso:
            (processoRaw.numero_processo as string | null) ?? null,
          trt: (processoRaw.trt as string | null) ?? null,
          grau: (processoRaw.grau as string | null) ?? null,
          dataAutuacao: (processoRaw.data_autuacao as string | null) ?? null,
        }
      : null,
  };
}

function converterParaContrato(data: Record<string, unknown>): Contrato {
  const partesRaw = (data.contrato_partes as unknown[] | null) ?? [];
  const statusHistoricoRaw =
    (data.contrato_status_historico as unknown[] | null) ?? [];
  const processosRaw = (data.contrato_processos as unknown[] | null) ?? [];

  return {
    id: data.id as number,
    segmentoId: (data.segmento_id as number | null) ?? null,
    tipoContrato: data.tipo_contrato as TipoContrato,
    tipoCobranca: data.tipo_cobranca as TipoCobranca,
    clienteId: data.cliente_id as number,
    papelClienteNoContrato: data.papel_cliente_no_contrato as PapelContratual,
    status: data.status as StatusContrato,
    cadastradoEm: data.cadastrado_em as string,
    responsavelId: (data.responsavel_id as number | null) ?? null,
    createdBy: (data.created_by as number | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    documentos: (data.documentos as string | null) ?? null,
    dadosAnteriores:
      (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    estagioId: (data.estagio_id as number | null) ?? null,
    partes: partesRaw.map((p) =>
      converterParaContratoParte(p as Record<string, unknown>),
    ),
    statusHistorico: statusHistoricoRaw.map((h) =>
      converterParaContratoStatusHistorico(h as Record<string, unknown>),
    ),
    processos: processosRaw.map((p) =>
      converterParaContratoProcessoVinculo(p as Record<string, unknown>),
    ),
  };
}

/**
 * Converte data ISO string para formato date (YYYY-MM-DD) ou null
 */
function parseDateTime(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildContratoPartesRows(params: {
  contratoId: number;
  clienteId: number;
  papelClienteNoContrato: PapelContratual;
  partes: Array<{
    tipoEntidade: TipoEntidadeContrato;
    entidadeId: number;
    papelContratual: PapelContratual;
    ordem?: number;
  }>;
}): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  const pushUnique = (row: {
    tipo_entidade: string;
    entidade_id: number;
    papel_contratual: PapelContratual;
    ordem: number;
  }) => {
    const key = `${row.tipo_entidade}:${row.entidade_id}:${row.papel_contratual}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      contrato_id: params.contratoId,
      tipo_entidade: row.tipo_entidade,
      entidade_id: row.entidade_id,
      papel_contratual: row.papel_contratual,
      ordem: row.ordem,
    });
  };

  // Cliente principal sempre presente
  pushUnique({
    tipo_entidade: "cliente",
    entidade_id: params.clienteId,
    papel_contratual: params.papelClienteNoContrato,
    ordem: 0,
  });

  for (const p of params.partes) {
    pushUnique({
      tipo_entidade: p.tipoEntidade,
      entidade_id: p.entidadeId,
      papel_contratual: p.papelContratual,
      ordem: p.ordem ?? 0,
    });
  }

  return rows;
}

// =============================================================================
// FUNÇÕES DE LEITURA
// =============================================================================

/**
 * Busca um contrato pelo ID
 */
export async function findContratoById(
  id: number,
): Promise<Result<Contrato | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CONTRATOS)
      .select(
        "*, contrato_partes(*), contrato_status_historico(*), contrato_processos(*, acervo(id, numero_processo, trt, grau, data_autuacao))",
      )
      .eq("id", id)
      .order("ordem", { foreignTable: "contrato_partes", ascending: true })
      .order("changed_at", {
        foreignTable: "contrato_status_historico",
        ascending: false,
      })
      .order("created_at", {
        foreignTable: "contrato_processos",
        ascending: false,
      })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(converterParaContrato(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar contrato",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Lista contratos com filtros e paginação
 */
export async function findAllContratos(
  params: ListarContratosParams = {},
): Promise<Result<PaginatedResponse<Contrato>>> {
  try {
    const db = createDbClient();

    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    // Nota: contrato_status_historico NÃO é incluído na listagem pois não é usado
    // nas colunas da tabela. Ele é carregado apenas em findContratoById (detalhe).
    let query = db
      .from(TABLE_CONTRATOS)
      .select(
        "*, contrato_partes(*), contrato_processos(*, acervo(id, numero_processo, trt, grau, data_autuacao))",
        { count: "exact" },
      );

    // Aplicar filtros
    if (params.busca) {
      const busca = params.busca.trim();
      query = query.ilike("observacoes", `%${busca}%`);
    }

    // Filtro por período (created_at)
    if (params.dataInicio) {
      const d = new Date(params.dataInicio);
      if (!Number.isNaN(d.getTime())) {
        query = query.gte("created_at", d.toISOString());
      }
    }
    if (params.dataFim) {
      const d = new Date(params.dataFim);
      if (!Number.isNaN(d.getTime())) {
        query = query.lte("created_at", d.toISOString());
      }
    }

    if (params.segmentoId) {
      query = query.eq("segmento_id", params.segmentoId);
    }

    if (params.tipoContrato) {
      query = query.eq("tipo_contrato", params.tipoContrato);
    }

    if (params.tipoCobranca) {
      query = query.eq("tipo_cobranca", params.tipoCobranca);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.clienteId) {
      query = query.eq("cliente_id", params.clienteId);
    }

    if (params.responsavelId) {
      query = query.eq("responsavel_id", params.responsavelId);
    }

    // Ordenação
    const ordenarPor = params.ordenarPor ?? "created_at";
    const ordem = params.ordem ?? "desc";
    if (ordenarPor === "cadastrado_em") {
      query = query.order("cadastrado_em", { ascending: ordem === "asc" });
    } else if (ordenarPor === "segmento_id") {
      query = query.order("segmento_id", { ascending: ordem === "asc" });
    } else {
      query = query.order(ordenarPor, { ascending: ordem === "asc" });
    }

    // Paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    const contratos = (data || []).map((item) =>
      converterParaContrato(item as Record<string, unknown>),
    );
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: contratos,
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar contratos",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Verifica se um cliente existe
 */
export async function clienteExists(
  clienteId: number,
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .select("id")
      .eq("id", clienteId)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar cliente",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos agrupados por status
 */
export async function countContratosPorStatus(params?: {
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<Result<Record<StatusContrato, number>>> {
  try {
    const db = createDbClient();

    const STATUSES: StatusContrato[] = [
      "em_contratacao",
      "contratado",
      "distribuido",
      "desistencia",
    ];

    // Uma query de agregação real por status (head: true) evita o limite
    // default de 1000 linhas do supabase-js quando usamos select("status").
    const results = await Promise.all(
      STATUSES.map(async (status) => {
        let query = db
          .from(TABLE_CONTRATOS)
          .select("*", { count: "exact", head: true })
          .eq("status", status);

        if (params?.dataInicio) {
          query = query.gte("created_at", params.dataInicio.toISOString());
        }
        if (params?.dataFim) {
          query = query.lte("created_at", params.dataFim.toISOString());
        }

        const { count, error } = await query;
        return { status, count: count ?? 0, error };
      }),
    );

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) {
      return err(
        appError("DATABASE_ERROR", firstError.message, {
          code: firstError.code,
        }),
      );
    }

    const contadores: Record<StatusContrato, number> = {
      em_contratacao: 0,
      contratado: 0,
      distribuido: 0,
      desistencia: 0,
    };

    results.forEach(({ status, count }) => {
      contadores[status] = count;
    });

    return ok(contadores);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos por status",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta o total de contratos no banco
 */
export async function countContratos(): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true });

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos criados até uma data específica
 */
export async function countContratosAteData(
  dataLimite: Date,
): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .lte("created_at", dataLimite.toISOString());

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos até data",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos criados entre duas datas (inclusive)
 */
export async function countContratosEntreDatas(
  dataInicio: Date,
  dataFim: Date,
): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .gte("created_at", dataInicio.toISOString())
      .lte("created_at", dataFim.toISOString());

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos entre datas",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// FUNÇÕES DE ESCRITA
// =============================================================================

/**
 * Cria um novo contrato no banco
 */
export async function saveContrato(
  input: CreateContratoInput,
): Promise<Result<Contrato>> {
  try {
    const db = createDbClient();

    const cadastradoEm =
      parseDateTime(input.cadastradoEm) ?? new Date().toISOString();

    // Preparar dados para inserção (snake_case)
    const dadosInsercao: Record<string, unknown> = {
      tipo_contrato: input.tipoContrato,
      tipo_cobranca: input.tipoCobranca,
      cliente_id: input.clienteId,
      papel_cliente_no_contrato: input.papelClienteNoContrato,
      status: input.status ?? "em_contratacao",
      cadastrado_em: cadastradoEm,
      responsavel_id: input.responsavelId ?? null,
      created_by: input.createdBy ?? null,
      observacoes: input.observacoes?.trim() ?? null,
    };

    if (input.segmentoId) {
      dadosInsercao.segmento_id = input.segmentoId;
    }

    const { data: inserted, error } = await db
      .from(TABLE_CONTRATOS)
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      return err(
        appError("DATABASE_ERROR", `Erro ao criar contrato: ${error.message}`, {
          code: error.code,
        }),
      );
    }

    const contratoId = (inserted as Record<string, unknown>).id as number;

    const partesRows = buildContratoPartesRows({
      contratoId,
      clienteId: input.clienteId,
      papelClienteNoContrato: input.papelClienteNoContrato,
      partes: input.partes ?? [],
    });

    const { error: partesError } = await db
      .from(TABLE_CONTRATO_PARTES)
      .insert(partesRows);
    if (partesError) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao inserir contrato_partes: ${partesError.message}`,
          { code: partesError.code },
        ),
      );
    }

    const { error: historicoError } = await db
      .from(TABLE_CONTRATO_STATUS_HISTORICO)
      .insert({
        contrato_id: contratoId,
        from_status: null,
        to_status: (dadosInsercao.status as StatusContrato) ?? "em_contratacao",
        changed_at: cadastradoEm,
        changed_by: input.createdBy ?? null,
      });
    if (historicoError) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao inserir contrato_status_historico: ${historicoError.message}`,
          { code: historicoError.code },
        ),
      );
    }

    const contratoResult = await findContratoById(contratoId);
    if (!contratoResult.success) return contratoResult;
    if (!contratoResult.data) {
      return err(
        appError("DATABASE_ERROR", "Contrato recém-criado não foi encontrado"),
      );
    }
    return ok(contratoResult.data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar contrato",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Atualiza um contrato existente
 */
export async function updateContrato(
  id: number,
  input: UpdateContratoInput,
  contratoExistente: Contrato,
): Promise<Result<Contrato>> {
  try {
    const db = createDbClient();

    // Preparar dados para atualização (snake_case)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.segmentoId !== undefined) {
      dadosAtualizacao.segmento_id = input.segmentoId;
    }
    if (input.tipoContrato !== undefined) {
      dadosAtualizacao.tipo_contrato = input.tipoContrato;
    }
    if (input.tipoCobranca !== undefined) {
      dadosAtualizacao.tipo_cobranca = input.tipoCobranca;
    }
    if (input.clienteId !== undefined) {
      dadosAtualizacao.cliente_id = input.clienteId;
    }
    if (input.papelClienteNoContrato !== undefined) {
      dadosAtualizacao.papel_cliente_no_contrato = input.papelClienteNoContrato;
    }
    if (input.status !== undefined) {
      dadosAtualizacao.status = input.status;
    }
    if (input.cadastradoEm !== undefined) {
      dadosAtualizacao.cadastrado_em = input.cadastradoEm
        ? parseDateTime(input.cadastradoEm)
        : new Date().toISOString();
    }
    if (input.responsavelId !== undefined) {
      dadosAtualizacao.responsavel_id = input.responsavelId;
    }
    if (input.observacoes !== undefined) {
      dadosAtualizacao.observacoes = input.observacoes?.trim() ?? null;
    }

    // Preservar apenas campos críticos no snapshot de auditoria
    // Evita crescimento recursivo de dados_anteriores
    dadosAtualizacao.dados_anteriores = {
      id: contratoExistente.id,
      status: contratoExistente.status,
      clienteId: contratoExistente.clienteId,
      segmentoId: contratoExistente.segmentoId,
      tipoContrato: contratoExistente.tipoContrato,
      cadastradoEm: contratoExistente.cadastradoEm,
      responsavelId: contratoExistente.responsavelId,
      updated_at_previous: contratoExistente.updatedAt,
    };

    const { data: updated, error } = await db
      .from(TABLE_CONTRATOS)
      .update(dadosAtualizacao)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar contrato: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    if (
      input.status !== undefined &&
      input.status !== contratoExistente.status
    ) {
      const { error: historicoError } = await db
        .from(TABLE_CONTRATO_STATUS_HISTORICO)
        .insert({
          contrato_id: id,
          from_status: contratoExistente.status,
          to_status: input.status,
          changed_at: new Date().toISOString(),
          changed_by: (updated as Record<string, unknown>).created_by as
            | number
            | null,
        });

      if (historicoError) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao inserir contrato_status_historico: ${historicoError.message}`,
            { code: historicoError.code },
          ),
        );
      }
    }

    if (input.partes !== undefined) {
      const { error: deleteError } = await db
        .from(TABLE_CONTRATO_PARTES)
        .delete()
        .eq("contrato_id", id);
      if (deleteError) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao atualizar contrato_partes: ${deleteError.message}`,
            {
              code: deleteError.code,
            },
          ),
        );
      }

      const clienteId =
        (dadosAtualizacao.cliente_id as number | undefined) ??
        contratoExistente.clienteId;
      const papelClienteNoContrato =
        (dadosAtualizacao.papel_cliente_no_contrato as
          | PapelContratual
          | undefined) ?? contratoExistente.papelClienteNoContrato;

      const partesRows = buildContratoPartesRows({
        contratoId: id,
        clienteId,
        papelClienteNoContrato,
        partes: input.partes,
      });

      const { error: insertError } = await db
        .from(TABLE_CONTRATO_PARTES)
        .insert(partesRows);
      if (insertError) {
        return err(
          appError(
            "DATABASE_ERROR",
            `Erro ao atualizar contrato_partes: ${insertError.message}`,
            {
              code: insertError.code,
            },
          ),
        );
      }
    }

    const contratoResult = await findContratoById(id);
    if (!contratoResult.success) return contratoResult;
    if (!contratoResult.data) {
      return err(
        appError("DATABASE_ERROR", "Contrato atualizado não foi encontrado"),
      );
    }

    return ok(contratoResult.data);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar contrato",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos criados no mês corrente (a partir do primeiro dia do mês atual)
 */
export async function countContratosNovosMes(): Promise<Result<number>> {
  try {
    const db = createDbClient();

    const agora = new Date();
    const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    primeiroDiaMes.setHours(0, 0, 0, 0);

    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .gte("created_at", primeiroDiaMes.toISOString());

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos novos do mês",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Retorna array de { mes: string (YYYY-MM), count: number } para os últimos N meses.
 * Os meses são ordenados do mais antigo para o mais recente.
 */
export async function countContratosTrendMensal(
  months: number,
): Promise<Result<Array<{ mes: string; count: number }>>> {
  try {
    const db = createDbClient();

    const agora = new Date();
    // Primeiro dia do mês atual
    const primeiroDiaMesAtual = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1,
    );
    primeiroDiaMesAtual.setHours(0, 0, 0, 0);

    // Data de início: primeiro dia do mês N meses atrás
    const dataInicio = new Date(primeiroDiaMesAtual);
    dataInicio.setMonth(dataInicio.getMonth() - (months - 1));

    const { data, error } = await db
      .from(TABLE_CONTRATOS)
      .select("created_at")
      .gte("created_at", dataInicio.toISOString());

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    // Inicializar mapa para todos os meses no range
    const contadores = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(primeiroDiaMesAtual);
      d.setMonth(d.getMonth() - (months - 1 - i));
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      contadores.set(chave, 0);
    }

    // Agrupar registros por YYYY-MM
    for (const row of data || []) {
      const d = new Date(row.created_at as string);
      if (isNaN(d.getTime())) continue;
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (contadores.has(chave)) {
        contadores.set(chave, (contadores.get(chave) ?? 0) + 1);
      }
    }

    const resultado = Array.from(contadores.entries()).map(([mes, count]) => ({
      mes,
      count,
    }));

    return ok(resultado);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao calcular trend mensal de contratos",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Soma o valor_causa de todos os contratos ativos (contratado ou distribuido)
 */
export async function sumValorContratosAtivos(): Promise<Result<number>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CONTRATOS)
      .select("valor_causa")
      .in("status", ["contratado", "distribuido"]);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    const total = (data ?? []).reduce(
      (acc, row) => acc + (row.valor_causa ?? 0),
      0,
    );
    return ok(total);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao somar valor dos contratos ativos",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos ativos com vencimento nos próximos N dias
 */
export async function countContratosVencendo(
  dias: number,
): Promise<Result<number>> {
  try {
    const db = createDbClient();

    const now = new Date().toISOString();
    const futureDate = new Date(
      Date.now() + dias * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .in("status", ["contratado", "distribuido"])
      .gte("data_vencimento", now)
      .lte("data_vencimento", futureDate);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos vencendo",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Conta contratos em andamento sem responsável atribuído
 */
export async function countContratosSemResponsavel(): Promise<Result<number>> {
  try {
    const db = createDbClient();

    const { count, error } = await db
      .from(TABLE_CONTRATOS)
      .select("*", { count: "exact", head: true })
      .in("status", ["em_contratacao", "contratado", "distribuido"])
      .is("responsavel_id", null);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code }),
      );
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao contar contratos sem responsável",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Remove permanentemente um contrato
 */
export async function deleteContrato(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // 1. Remover dependências manuais (se não houver cascade)
    // Tabela de junção many-to-many ou one-to-many fortes
    await db.from(TABLE_CONTRATO_PARTES).delete().eq("contrato_id", id);
    await db
      .from(TABLE_CONTRATO_STATUS_HISTORICO)
      .delete()
      .eq("contrato_id", id);

    // Contrato Processos
    await db.from("contrato_processos").delete().eq("contrato_id", id);

    // Contrato Tags
    await db.from("contrato_tags").delete().eq("contrato_id", id);

    // Documentos do Contrato
    await db.from("contrato_documentos").delete().eq("contrato_id", id);

    // Lançamentos Financeiros (cuidado: isso apaga financeiro)
    await db.from("lancamentos_financeiros").delete().eq("contrato_id", id);

    // 2. Remover contrato
    const { error } = await db.from(TABLE_CONTRATOS).delete().eq("id", id);

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao excluir contrato: ${error.message}`,
          { code: error.code },
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir contrato",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}
