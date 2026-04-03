/**
 * PERÍCIAS REPOSITORY - Camada de Persistência
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { addDays } from "@/lib/date-utils";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import type {
  Pericia,
  ListarPericiasParams,
  SituacaoPericiaCodigo,
  CriarPericiaInput,
} from "./domain";
import type { CodigoTribunal, GrauTribunal } from "@/app/(authenticated)/expedientes";

const TABLE_PERICIAS = "pericias";

type PericiaRow = {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number;
  orgao_julgador_id: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numero_processo: string;
  prazo_entrega: string | null;
  data_aceite: string | null;
  data_criacao: string;
  situacao_codigo: SituacaoPericiaCodigo;
  situacao_descricao: string | null;
  situacao_pericia: string | null;
  id_documento_laudo: number | null;
  laudo_juntado: boolean;
  especialidade_id: number | null;
  perito_id: number | null;
  classe_judicial_sigla: string | null;
  data_proxima_audiencia: string | null;
  segredo_justica: boolean;
  juizo_digital: boolean;
  arquivado: boolean;
  prioridade_processual: boolean;
  permissoes_pericia: Record<string, boolean> | null;
  funcionalidade_editor: string | null;
  responsavel_id: number | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PericiaRowWithJoins = PericiaRow & {
  especialidade?: { descricao: string } | null;
  perito?: { nome: string } | null;
  responsavel?: { nome_exibicao: string } | null;
  processo?: {
    numero_processo: string;
    nome_parte_autora: string | null;
    nome_parte_re: string | null;
  } | null;
};

function converterParaPericia(data: PericiaRowWithJoins): Pericia {
  return {
    id: data.id,
    idPje: data.id_pje,
    advogadoId: data.advogado_id,
    processoId: data.processo_id,
    orgaoJulgadorId: data.orgao_julgador_id,
    trt: data.trt,
    grau: data.grau,
    numeroProcesso: data.numero_processo,
    prazoEntrega: data.prazo_entrega,
    dataAceite: data.data_aceite,
    dataCriacao: data.data_criacao,
    situacaoCodigo: data.situacao_codigo,
    situacaoDescricao: data.situacao_descricao,
    situacaoPericia: data.situacao_pericia,
    idDocumentoLaudo: data.id_documento_laudo,
    laudoJuntado: data.laudo_juntado,
    especialidadeId: data.especialidade_id,
    peritoId: data.perito_id,
    classeJudicialSigla: data.classe_judicial_sigla,
    dataProximaAudiencia: data.data_proxima_audiencia,
    segredoJustica: data.segredo_justica,
    juizoDigital: data.juizo_digital,
    arquivado: data.arquivado,
    prioridadeProcessual: data.prioridade_processual,
    permissoesPericia: data.permissoes_pericia,
    funcionalidadeEditor: data.funcionalidade_editor,
    responsavelId: data.responsavel_id,
    observacoes: data.observacoes,
    dadosAnteriores: data.dados_anteriores,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    especialidade: data.especialidade ?? null,
    perito: data.perito ?? null,
    responsavel: data.responsavel
      ? { nomeExibicao: data.responsavel.nome_exibicao }
      : null,
    processo: data.processo
      ? {
        numeroProcesso: data.processo.numero_processo,
        nomeParteAutora: data.processo.nome_parte_autora,
        nomeParteRe: data.processo.nome_parte_re,
      }
      : null,
  };
}

function calcularProximoDia(dataStr: string): string {
  return addDays(dataStr, 1);
}

export async function findAllPericias(
  params: ListarPericiasParams = {}
): Promise<Result<PaginatedResponse<Pericia>>> {
  try {
    const db = createDbClient();
    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    let query = db
      .from(TABLE_PERICIAS)
      .select(
        `
        *,
        especialidade:especialidades_pericia(descricao),
        perito:terceiros(nome),
        responsavel:usuarios(nome_exibicao),
        processo:acervo(numero_processo, nome_parte_autora, nome_parte_re)
      `,
        { count: "exact" }
      );

    if (params.busca) {
      query = query.or(
        `numero_processo.ilike.%${params.busca}%,observacoes.ilike.%${params.busca}%`
      );
    }

    if (params.processoId) query = query.eq("processo_id", params.processoId);
    if (params.trt) query = query.eq("trt", params.trt);
    if (params.grau) query = query.eq("grau", params.grau);
    if (params.situacaoCodigo)
      query = query.eq("situacao_codigo", params.situacaoCodigo);
    if (params.situacoesExcluidas && params.situacoesExcluidas.length > 0) {
      // Exclui perícias com códigos de situação na lista
      for (const codigo of params.situacoesExcluidas) {
        query = query.neq("situacao_codigo", codigo);
      }
    }

    if (params.responsavelId) {
      if (params.responsavelId === "null")
        query = query.is("responsavel_id", null);
      else query = query.eq("responsavel_id", params.responsavelId);
    }
    if (params.semResponsavel) query = query.is("responsavel_id", null);

    if (params.especialidadeId)
      query = query.eq("especialidade_id", params.especialidadeId);
    if (params.peritoId) query = query.eq("perito_id", params.peritoId);

    if (params.laudoJuntado !== undefined)
      query = query.eq("laudo_juntado", params.laudoJuntado);

    if (params.prazoEntregaInicio)
      query = query.gte("prazo_entrega", params.prazoEntregaInicio);
    if (params.prazoEntregaFim) {
      const proximoDia = calcularProximoDia(params.prazoEntregaFim);
      query = query.lt("prazo_entrega", proximoDia);
    }

    if (params.dataCriacaoInicio)
      query = query.gte("data_criacao", params.dataCriacaoInicio);
    if (params.dataCriacaoFim) {
      const proximoDia = calcularProximoDia(params.dataCriacaoFim);
      query = query.lt("data_criacao", proximoDia);
    }

    if (params.segredoJustica !== undefined)
      query = query.eq("segredo_justica", params.segredoJustica);
    if (params.prioridadeProcessual !== undefined)
      query = query.eq("prioridade_processual", params.prioridadeProcessual);
    if (params.arquivado !== undefined)
      query = query.eq("arquivado", params.arquivado);

    const ordenarPor = params.ordenarPor ?? "prazo_entrega";
    const ordem = params.ordem ?? "asc";
    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;
    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    const pericias = (data || []).map((row) =>
      converterParaPericia(row as unknown as PericiaRowWithJoins)
    );

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: pericias,
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
        "Erro ao listar perícias.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findPericiaById(
  id: number
): Promise<Result<Pericia | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PERICIAS)
      .select(
        `
        *,
        especialidade:especialidades_pericia(descricao),
        perito:terceiros(nome),
        responsavel:usuarios(nome_exibicao),
        processo:acervo(numero_processo)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }
    if (!data) return ok(null);

    return ok(converterParaPericia(data as unknown as PericiaRowWithJoins));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar perícia.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function atribuirResponsavelPericia(
  periciaId: number,
  responsavelId: number
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PERICIAS)
      .update({
        responsavel_id: responsavelId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periciaId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(true);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atribuir responsável.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function adicionarObservacaoPericia(
  periciaId: number,
  observacoes: string
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PERICIAS)
      .update({
        observacoes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periciaId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(true);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar observações.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function listEspecialidadesPericia(): Promise<
  Result<{ id: number; descricao: string }[]>
> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from("especialidades_pericia")
      .select("id,descricao")
      .eq("ativo", true)
      .order("descricao", { ascending: true })
      .limit(500);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok((data || []) as { id: number; descricao: string }[]);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar especialidades de perícia.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function criarPericia(
  input: CriarPericiaInput,
  advogadoId: number
): Promise<Result<Pericia>> {
  try {
    const db = createDbClient();

    // 1. Gerar id_pje sequencial negativo para perícias manuais
    const { data: minIdPje } = await db
      .from(TABLE_PERICIAS)
      .select("id_pje")
      .lt("id_pje", 0)
      .order("id_pje", { ascending: true })
      .limit(1)
      .maybeSingle();

    const novoIdPje = minIdPje?.id_pje ? minIdPje.id_pje - 1 : -1;

    // 2. Buscar processo_id pelo numero_processo (se existir no acervo)
    const { data: processo } = await db
      .from("acervo")
      .select("id")
      .eq("numero_processo", input.numeroProcesso)
      .eq("origem", "acervo_geral")
      .maybeSingle();

    // 3. INSERT na tabela pericias
    const now = new Date().toISOString();
    const { data, error } = await db
      .from(TABLE_PERICIAS)
      .insert({
        id_pje: novoIdPje,
        advogado_id: advogadoId,
        processo_id: processo?.id ?? null,
        trt: input.trt as CodigoTribunal,
        grau: input.grau as GrauTribunal,
        numero_processo: input.numeroProcesso,
        prazo_entrega: input.prazoEntrega ?? null,
        situacao_codigo: input.situacaoCodigo,
        situacao_descricao: null,
        situacao_pericia: null,
        especialidade_id: input.especialidadeId ?? null,
        perito_id: input.peritoId ?? null,
        observacoes: input.observacoes ?? null,
        data_criacao: now,
        laudo_juntado: false,
        segredo_justica: false,
        juizo_digital: false,
        arquivado: false,
        prioridade_processual: false,
        created_at: now,
        updated_at: now,
      })
      .select(
        `
        *,
        especialidade:especialidades_pericia(descricao),
        perito:terceiros(nome),
        responsavel:usuarios(nome_exibicao),
        processo:acervo(numero_processo, nome_parte_autora, nome_parte_re)
      `
      )
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    // 4. Trigger irá atribuir responsavel_id automaticamente (se processo tem responsável)
    return ok(converterParaPericia(data as unknown as PericiaRowWithJoins));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar perícia.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function atualizarSituacaoPericia(
  periciaId: number,
  situacaoCodigo: SituacaoPericiaCodigo
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PERICIAS)
      .update({
        situacao_codigo: situacaoCodigo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periciaId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(true);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar situação da perícia.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}


