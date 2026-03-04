import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result, type PaginatedResponse } from "@/types/result";
import {
  type Projeto,
  type CreateProjetoInput,
  type UpdateProjetoInput,
  type ListarProjetosParams,
  converterParaProjeto,
} from "../domain";
import { escapeIlike, validateSortColumn } from "./utils";

const TABLE = "pm_projetos";

export async function listProjetos(
  params: ListarProjetosParams
): Promise<Result<PaginatedResponse<Projeto>>> {
  try {
    const db = createDbClient();
    const page = Math.max(1, params.pagina ?? 1);
    const limit = Math.min(100, Math.max(1, params.limite ?? 50));
    const offset = (page - 1) * limit;

    let query = db
      .from(TABLE)
      .select(
        `*,
        responsavel:usuarios!pm_projetos_responsavel_id_fkey(nome_completo, avatar_url),
        cliente:clientes!pm_projetos_cliente_id_fkey(nome)`,
        { count: "exact" }
      );

    // Filtros
    if (params.busca) {
      const search = escapeIlike(params.busca);
      query = query.or(`nome.ilike.%${search}%,descricao.ilike.%${search}%`);
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.prioridade) {
      query = query.eq("prioridade", params.prioridade);
    }
    if (params.responsavelId) {
      query = query.eq("responsavel_id", params.responsavelId);
    }
    if (params.clienteId) {
      query = query.eq("cliente_id", params.clienteId);
    }
    if (params.dataInicioDe) {
      query = query.gte("data_inicio", params.dataInicioDe);
    }
    if (params.dataInicioAte) {
      query = query.lte("data_inicio", params.dataInicioAte);
    }

    // Ordenação
    const ALLOWED_SORT_COLUMNS = ["created_at", "nome", "status", "prioridade", "data_inicio", "data_previsao_fim", "orcamento"] as const;
    const sortColumn = validateSortColumn(params.ordenarPor, ALLOWED_SORT_COLUMNS, "created_at");
    const ascending = params.ordem === "asc";
    query = query.order(sortColumn, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const projetos = (data ?? []).map((row) => {
      const flat = {
        ...row,
        responsavel_nome: row.responsavel?.nome_completo,
        responsavel_avatar: row.responsavel?.avatar_url,
        cliente_nome: row.cliente?.nome,
      };
      return converterParaProjeto(flat as Record<string, unknown>);
    });

    return ok({
      data: projetos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar projetos", undefined, error as Error));
  }
}

export async function findProjetoById(id: string): Promise<Result<Projeto>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .select(
        `*,
        responsavel:usuarios!pm_projetos_responsavel_id_fkey(nome_completo, avatar_url),
        cliente:clientes!pm_projetos_cliente_id_fkey(nome)`
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", `Projeto com ID ${id} não encontrado`));
      }
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    const flat = {
      ...data,
      responsavel_nome: data.responsavel?.nome_completo,
      responsavel_avatar: data.responsavel?.avatar_url,
      cliente_nome: data.cliente?.nome,
    };

    return ok(converterParaProjeto(flat as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao buscar projeto", undefined, error as Error));
  }
}

export async function saveProjeto(
  input: CreateProjetoInput,
  criadoPor: number
): Promise<Result<Projeto>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        nome: input.nome,
        descricao: input.descricao ?? null,
        status: input.status,
        prioridade: input.prioridade,
        data_inicio: input.dataInicio ?? null,
        data_previsao_fim: input.dataPrevisaoFim ?? null,
        cliente_id: input.clienteId ?? null,
        processo_id: input.processoId ?? null,
        contrato_id: input.contratoId ?? null,
        responsavel_id: input.responsavelId,
        orcamento: input.orcamento ?? null,
        tags: input.tags,
        criado_por: criadoPor,
      })
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(converterParaProjeto(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar projeto", undefined, error as Error));
  }
}

export async function updateProjeto(
  id: string,
  input: UpdateProjetoInput
): Promise<Result<Projeto>> {
  try {
    const db = createDbClient();

    const updateData: Record<string, unknown> = {};
    if (input.nome !== undefined) updateData.nome = input.nome;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;
    if (input.dataInicio !== undefined) updateData.data_inicio = input.dataInicio;
    if (input.dataPrevisaoFim !== undefined) updateData.data_previsao_fim = input.dataPrevisaoFim;
    if (input.dataConclusao !== undefined) updateData.data_conclusao = input.dataConclusao;
    if (input.clienteId !== undefined) updateData.cliente_id = input.clienteId;
    if (input.processoId !== undefined) updateData.processo_id = input.processoId;
    if (input.contratoId !== undefined) updateData.contrato_id = input.contratoId;
    if (input.responsavelId !== undefined) updateData.responsavel_id = input.responsavelId;
    if (input.orcamento !== undefined) updateData.orcamento = input.orcamento;
    if (input.valorGasto !== undefined) updateData.valor_gasto = input.valorGasto;
    if (input.progressoManual !== undefined) updateData.progresso_manual = input.progressoManual;
    if (input.tags !== undefined) updateData.tags = input.tags;

    const { data, error } = await db.from(TABLE).update(updateData).eq("id", id).select().single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", `Projeto com ID ${id} não encontrado`));
      }
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(converterParaProjeto(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao atualizar projeto", undefined, error as Error));
  }
}

export async function deleteProjeto(id: string): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).delete().eq("id", id);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao excluir projeto", undefined, error as Error));
  }
}

export async function updateProjetoProgresso(
  projetoId: string,
  progresso: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).update({ progresso }).eq("id", projetoId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao atualizar progresso", undefined, error as Error)
    );
  }
}
