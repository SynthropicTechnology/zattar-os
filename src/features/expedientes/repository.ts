/**
 * EXPEDIENTES REPOSITORY - Camada de Persistencia
 */

import { createDbClient } from "@/lib/supabase";
import { addDays } from "@/lib/date-utils";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import {
  Expediente,
  ListarExpedientesParams,
  CodigoTribunal,
  GrauTribunal,
  OrigemExpediente,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_EXPEDIENTES = "expedientes";
const TABLE_ACERVO = "acervo";
const TABLE_TIPOS_EXPEDIENTES = "tipos_expedientes";

type ExpedienteRow = {
  id: number;
  id_pje: number | null;
  advogado_id: number | null;
  processo_id: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numero_processo: string;
  descricao_orgao_julgador: string | null;
  classe_judicial: string;
  numero: number;
  segredo_justica: boolean;
  codigo_status_processo: string | null;
  prioridade_processual: boolean;
  nome_parte_autora: string | null;
  qtde_parte_autora: number | null;
  nome_parte_re: string | null;
  qtde_parte_re: number | null;
  data_autuacao: string | null;
  juizo_digital: boolean;
  data_arquivamento: string | null;
  id_documento: number | null;
  data_ciencia_parte: string | null;
  data_prazo_legal_parte: string | null;
  data_criacao_expediente: string | null;
  prazo_vencido: boolean;
  sigla_orgao_julgador: string | null;
  dados_anteriores: Record<string, unknown> | null;
  responsavel_id: number | null;
  baixado_em: string | null;
  protocolo_id: string | null;
  justificativa_baixa: string | null;
  tipo_expediente_id: number | null;
  descricao_arquivos: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  arquivo_bucket: string | null;
  arquivo_key: string | null;
  observacoes: string | null;
  origem: OrigemExpediente;
  created_at: string;
  updated_at: string;
};

export type ExpedienteInsertInput = Partial<
  Omit<ExpedienteRow, "id" | "created_at" | "updated_at">
>;
export type ExpedienteUpdateInput = Partial<Omit<ExpedienteRow, "id">>;

// =============================================================================
// CONVERSORES
// =============================================================================

// Tipo estendido para incluir campos de origem da view
type ExpedienteRowComOrigem = ExpedienteRow & {
  trt_origem?: string | null;
  nome_parte_autora_origem?: string | null;
  nome_parte_re_origem?: string | null;
  orgao_julgador_origem?: string | null;
};

function converterParaExpediente(data: ExpedienteRow | ExpedienteRowComOrigem): Expediente {
  const expediente: Expediente = {
    id: data.id,
    idPje: data.id_pje,
    advogadoId: data.advogado_id,
    processoId: data.processo_id,
    trt: data.trt,
    grau: data.grau,
    numeroProcesso: data.numero_processo,
    descricaoOrgaoJulgador: data.descricao_orgao_julgador,
    classeJudicial: data.classe_judicial,
    numero: data.numero,
    segredoJustica: data.segredo_justica,
    codigoStatusProcesso: data.codigo_status_processo,
    prioridadeProcessual: data.prioridade_processual,
    nomeParteAutora: data.nome_parte_autora,
    qtdeParteAutora: data.qtde_parte_autora,
    nomeParteRe: data.nome_parte_re,
    qtdeParteRe: data.qtde_parte_re,
    dataAutuacao: data.data_autuacao,
    juizoDigital: data.juizo_digital,
    dataArquivamento: data.data_arquivamento,
    idDocumento: data.id_documento,
    dataCienciaParte: data.data_ciencia_parte,
    dataPrazoLegalParte: data.data_prazo_legal_parte,
    dataCriacaoExpediente: data.data_criacao_expediente,
    prazoVencido: data.prazo_vencido,
    siglaOrgaoJulgador: data.sigla_orgao_julgador,
    dadosAnteriores: data.dados_anteriores,
    responsavelId: data.responsavel_id,
    baixadoEm: data.baixado_em,
    protocoloId: data.protocolo_id,
    justificativaBaixa: data.justificativa_baixa,
    tipoExpedienteId: data.tipo_expediente_id,
    descricaoArquivos: data.descricao_arquivos,
    arquivoNome: data.arquivo_nome,
    arquivoUrl: data.arquivo_url,
    arquivoBucket: data.arquivo_bucket,
    arquivoKey: data.arquivo_key,
    observacoes: data.observacoes,
    origem: data.origem,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  // Campos de origem (fonte da verdade - 1º grau)
  // Esses campos vêm da view expedientes_com_origem
  const dataComOrigem = data as ExpedienteRowComOrigem;
  if (dataComOrigem.trt_origem) {
    expediente.trtOrigem = dataComOrigem.trt_origem;
  }
  if (dataComOrigem.nome_parte_autora_origem) {
    expediente.nomeParteAutoraOrigem = dataComOrigem.nome_parte_autora_origem;
  }
  if (dataComOrigem.nome_parte_re_origem) {
    expediente.nomeParteReOrigem = dataComOrigem.nome_parte_re_origem;
  }
  if (dataComOrigem.orgao_julgador_origem) {
    expediente.orgaoJulgadorOrigem = dataComOrigem.orgao_julgador_origem;
  }

  return expediente;
}

// =============================================================================
// FUNCOES DE LEITURA
// =============================================================================

export async function findExpedienteById(
  id: number
): Promise<Result<Expediente | null>> {
  try {
    const db = createDbClient();
    // Usar view com dados de origem (1º grau) para partes corretas
    const { data, error } = await db
      .from("expedientes_com_origem")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return ok(null);
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findAllExpedientes(
  params: ListarExpedientesParams = {}
): Promise<Result<PaginatedResponse<Expediente>>> {
  try {
    const db = createDbClient();
    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    // Usar view com dados de origem (1º grau) para partes corretas
    let query = db.from("expedientes_com_origem").select("*", { count: "exact" });

    if (params.busca) {
      query = query.or(
        `numero_processo.ilike.%${params.busca}%,observacoes.ilike.%${params.busca}%`
      );
    }
    if (params.trt) query = query.eq("trt", params.trt);
    if (params.grau) query = query.eq("grau", params.grau);
    if (params.responsavelId) {
      if (params.responsavelId === "null")
        query = query.is("responsavel_id", null);
      else query = query.eq("responsavel_id", params.responsavelId);
    }
    if (params.tipoExpedienteId)
      query = query.eq("tipo_expediente_id", params.tipoExpedienteId);
    if (params.semTipo) query = query.is("tipo_expediente_id", null);
    if (params.semResponsavel) query = query.is("responsavel_id", null);
    if (params.baixado === true) query = query.not("baixado_em", "is", null);
    if (params.baixado === false) query = query.is("baixado_em", null);
    if (params.semPrazo) query = query.is("data_prazo_legal_parte", null);
    if (params.prazoVencido !== undefined)
      query = query.eq("prazo_vencido", params.prazoVencido);
    // Importante: `gte/lte` exclui linhas onde `data_prazo_legal_parte` é null.
    // Para preservar o comportamento legado do calendário (itens "sem prazo" que aparecem em todos os dias),
    // quando `incluirSemPrazo` está ativo e há filtro de range, usamos OR: (range) OR (is null).
    if (params.dataPrazoLegalInicio || params.dataPrazoLegalFim) {
      // Helper: calcular próximo dia para filtro < (já que campo é timestamptz)
      const calcularProximoDia = (dataStr: string): string => {
        return addDays(dataStr, 1);
      };

      if (params.incluirSemPrazo) {
        const inicio = params.dataPrazoLegalInicio;
        const fim = params.dataPrazoLegalFim;

        if (inicio && fim) {
          // O campo data_prazo_legal_parte é timestamptz, não date.
          // Para capturar todo o dia, usar < dia_seguinte em vez de <= dia
          const proximoDia = calcularProximoDia(fim);
          query = query.or(
            `data_prazo_legal_parte.is.null,and(data_prazo_legal_parte.gte.${inicio},data_prazo_legal_parte.lt.${proximoDia})`
          );
        } else if (inicio) {
          query = query.or(
            `data_prazo_legal_parte.is.null,data_prazo_legal_parte.gte.${inicio}`
          );
        } else if (fim) {
          const proximoDia = calcularProximoDia(fim);
          query = query.or(
            `data_prazo_legal_parte.is.null,data_prazo_legal_parte.lt.${proximoDia}`
          );
        }
      } else {
        if (params.dataPrazoLegalInicio)
          query = query.gte(
            "data_prazo_legal_parte",
            params.dataPrazoLegalInicio
          );
        if (params.dataPrazoLegalFim) {
          const proximoDia = calcularProximoDia(params.dataPrazoLegalFim);
          query = query.lt("data_prazo_legal_parte", proximoDia);
        }
      }
    }
    if (params.dataCienciaInicio)
      query = query.gte("data_ciencia_parte", params.dataCienciaInicio);
    if (params.dataCienciaFim)
      query = query.lte("data_ciencia_parte", params.dataCienciaFim);
    if (params.dataCriacaoExpedienteInicio)
      query = query.gte(
        "data_criacao_expediente",
        params.dataCriacaoExpedienteInicio
      );
    if (params.dataCriacaoExpedienteFim)
      query = query.lte(
        "data_criacao_expediente",
        params.dataCriacaoExpedienteFim
      );
    if (params.classeJudicial)
      query = query.ilike("classe_judicial", `%${params.classeJudicial}%`);
    if (params.codigoStatusProcesso)
      query = query.eq("codigo_status_processo", params.codigoStatusProcesso);
    if (params.segredoJustica !== undefined)
      query = query.eq("segredo_justica", params.segredoJustica);
    if (params.juizoDigital !== undefined)
      query = query.eq("juizo_digital", params.juizoDigital);
    if (params.dataAutuacaoInicio)
      query = query.gte("data_autuacao", params.dataAutuacaoInicio);
    if (params.dataAutuacaoFim)
      query = query.lte("data_autuacao", params.dataAutuacaoFim);
    if (params.dataArquivamentoInicio)
      query = query.gte("data_arquivamento", params.dataArquivamentoInicio);
    if (params.dataArquivamentoFim)
      query = query.lte("data_arquivamento", params.dataArquivamentoFim);
    if (params.origem) query = query.eq("origem", params.origem);
    if (params.prioridadeProcessual !== undefined)
      query = query.eq("prioridade_processual", params.prioridadeProcessual);

    const ordenarPor = params.ordenarPor ?? "data_prazo_legal_parte";
    const ordem = params.ordem ?? "asc";
    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const expedientes = (data || []).map(converterParaExpediente);
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: expedientes,
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
        "Erro ao listar expedientes.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function processoExists(
  processoId: number
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ACERVO)
      .select("id")
      .eq("id", processoId)
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
        "Erro ao verificar processo.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function tipoExpedienteExists(
  tipoId: number
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_TIPOS_EXPEDIENTES)
      .select("id")
      .eq("id", tipoId)
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
        "Erro ao verificar tipo de expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNCOES DE ESCRITA
// =============================================================================

export async function saveExpediente(
  input: ExpedienteInsertInput
): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .insert(input)
      .select()
      .single();
    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao criar expediente: ${error.message}`,
          { code: error.code }
        )
      );
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function updateExpediente(
  id: number,
  input: ExpedienteUpdateInput,
  expedienteExistente: Expediente
): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    // Preserva o histórico de dados anteriores para auditoria, evitando aninhamento recursivo
    const dadosUpdate = {
      ...input,
      dados_anteriores: {
        ...expedienteExistente,
        dados_anteriores: undefined, // Evitar aninhamento recursivo profundo
        updated_at_previous: expedienteExistente.updatedAt,
      },
    };

    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .update(dadosUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar expediente: ${error.message}`,
          { code: error.code }
        )
      );
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function baixarExpediente(
  id: number,
  dados: {
    protocoloId?: string;
    justificativaBaixa?: string;
    baixadoEm?: string;
  }
): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const dadosUpdate = {
      baixado_em: dados.baixadoEm || new Date().toISOString(),
      protocolo_id: dados.protocoloId,
      justificativa_baixa: dados.justificativaBaixa,
    };
    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .update(dadosUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao baixar expediente: ${error.message}`,
          { code: error.code }
        )
      );
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao baixar expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function reverterBaixaExpediente(
  id: number
): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const dadosUpdate = {
      baixado_em: null,
      protocolo_id: null,
      justificativa_baixa: null,
    };
    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .update(dadosUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return err(
        appError("DATABASE_ERROR", `Erro ao reverter baixa: ${error.message}`, {
          code: error.code,
        })
      );
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao reverter baixa.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findExpedientesByClienteCPF(
  cpf: string
): Promise<Result<Expediente[]>> {
  try {
    const db = createDbClient();
    // Normalizar CPF (remover formatação)
    const cpfNormalizado = cpf.replace(/\D/g, "");

    if (!cpfNormalizado || cpfNormalizado.length !== 11) {
      return err(
        appError("VALIDATION_ERROR", "CPF inválido. Deve conter 11 dígitos.")
      );
    }

    // Buscar IDs dos clientes com o CPF fornecido
    const { data: clienteIdsData, error: clienteError } = await db
      .from("clientes")
      .select("id")
      .eq("cpf", cpfNormalizado);

    if (clienteError) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Falha ao buscar IDs de clientes: ${clienteError.message}`
        )
      );
    }

    const entidadeIds = clienteIdsData.map((c) => c.id);

    if (entidadeIds.length === 0) {
      return ok([]); // Nenhum cliente encontrado com este CPF
    }

    // Buscar expedientes através da relação:
    // clientes -> processo_partes -> processos -> expedientes
    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .select(
        `
        *,
        processo:processos!inner(
          id,
          numero_processo,
          processo_partes!inner(
            id,
            tipo_entidade,
            entidade_id
          )
        )
      `
      )
      .eq("processo.processo_partes.tipo_entidade", "cliente")
      .in("processo.processo_partes.entidade_id", entidadeIds)
      .order("data_prazo_legal_parte", { ascending: true, nullsFirst: true })
      .limit(100);

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Falha ao buscar pendentes por CPF: ${error.message}`
        )
      );
    }

    // Note: The cast to unknown then ExpedienteRow is to handle the joined data structure if necessary,
    // but here we just want the expediente columns effectively.
    // However, Supabase returns the joined structure.
    // We should map carefully. 'converterParaExpediente' expects ExpedienteRow.
    // The query returns `expedientes.*` plus `processo: ...`.
    // 'data' items contain expediente fields.
    const expedientes = (data || []).map((item) =>
      converterParaExpediente(item as unknown as ExpedienteRow)
    );

    return ok(expedientes);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar expedientes por CPF.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function updateResponsavel(
  expedienteId: number,
  responsavelId: number | null
): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .update({
        responsavel_id: responsavelId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expedienteId)
      .select()
      .single();

    if (error) {
      return err(
        appError(
          "DATABASE_ERROR",
          `Erro ao atualizar responsável: ${error.message}`
        )
      );
    }

    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar responsável.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
