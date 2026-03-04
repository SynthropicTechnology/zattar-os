import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result, type PaginatedResponse } from "@/types/result";
import {
  type Tarefa,
  type CreateTarefaInput,
  type UpdateTarefaInput,
  type UpdateKanbanOrderInput,
  type ListarTarefasParams,
  converterParaTarefa,
} from "../domain";
import { escapeIlike, validateSortColumn } from "./utils";

const TABLE = "pm_tarefas";

const SELECT_WITH_JOINS = `
  *,
  responsavel:usuarios!pm_tarefas_responsavel_id_fkey(nome_completo, avatar_url),
  projeto:pm_projetos!pm_tarefas_projeto_id_fkey(nome)
`;

function mapRow(row: Record<string, unknown>): Tarefa {
  const flat = {
    ...row,
    responsavel_nome: (row.responsavel as Record<string, unknown>)?.nome_completo,
    responsavel_avatar: (row.responsavel as Record<string, unknown>)?.avatar_url,
    projeto_nome: (row.projeto as Record<string, unknown>)?.nome,
  };
  return converterParaTarefa(flat as Record<string, unknown>);
}

export async function listTarefasByProject(
  projetoId: string,
  status?: string
): Promise<Result<Tarefa[]>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE)
      .select(SELECT_WITH_JOINS)
      .eq("projeto_id", projetoId)
      .is("tarefa_pai_id", null)
      .order("ordem_kanban", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar tarefas", undefined, error as Error));
  }
}

export async function listTarefasGlobal(
  params: ListarTarefasParams
): Promise<Result<PaginatedResponse<Tarefa>>> {
  try {
    const db = createDbClient();
    const page = Math.max(1, params.pagina ?? 1);
    const limit = Math.min(100, Math.max(1, params.limite ?? 50));
    const offset = (page - 1) * limit;

    let query = db.from(TABLE).select(SELECT_WITH_JOINS, { count: "exact" });

    if (params.busca) {
      const search = escapeIlike(params.busca);
      query = query.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`);
    }
    if (params.projetoId) {
      query = query.eq("projeto_id", params.projetoId);
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
    if (params.dataPrazoDe) {
      query = query.gte("data_prazo", params.dataPrazoDe);
    }
    if (params.dataPrazoAte) {
      query = query.lte("data_prazo", params.dataPrazoAte);
    }

    const ALLOWED_SORT_COLUMNS = ["created_at", "titulo", "status", "prioridade", "data_prazo"] as const;
    const sortColumn = validateSortColumn(params.ordenarPor, ALLOWED_SORT_COLUMNS, "created_at");
    const ascending = params.ordem === "asc";
    query = query.order(sortColumn, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const total = count ?? 0;

    return ok({
      data: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar tarefas", undefined, error as Error));
  }
}

export async function findTarefaById(id: string): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE).select(SELECT_WITH_JOINS).eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", `Tarefa com ID ${id} não encontrada`));
      }
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(mapRow(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao buscar tarefa", undefined, error as Error));
  }
}

export async function saveTarefa(
  input: CreateTarefaInput,
  criadoPor: number
): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    // Obter próxima ordem_kanban para a coluna de status
    const { data: maxOrder } = await db
      .from(TABLE)
      .select("ordem_kanban")
      .eq("projeto_id", input.projetoId)
      .eq("status", input.status ?? "a_fazer")
      .order("ordem_kanban", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrder ? (maxOrder.ordem_kanban as number) + 1 : 0;

    const { data, error } = await db
      .from(TABLE)
      .insert({
        projeto_id: input.projetoId,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        status: input.status ?? "a_fazer",
        prioridade: input.prioridade ?? "media",
        responsavel_id: input.responsavelId ?? null,
        data_prazo: input.dataPrazo ?? null,
        estimativa_horas: input.estimativaHoras ?? null,
        tarefa_pai_id: input.tarefaPaiId ?? null,
        ordem_kanban: nextOrder,
        criado_por: criadoPor,
      })
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaTarefa(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar tarefa", undefined, error as Error));
  }
}

export async function updateTarefa(
  id: string,
  input: UpdateTarefaInput
): Promise<Result<Tarefa>> {
  try {
    const db = createDbClient();

    const updateData: Record<string, unknown> = {};
    if (input.titulo !== undefined) updateData.titulo = input.titulo;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;
    if (input.responsavelId !== undefined) updateData.responsavel_id = input.responsavelId;
    if (input.dataPrazo !== undefined) updateData.data_prazo = input.dataPrazo;
    if (input.dataConclusao !== undefined) updateData.data_conclusao = input.dataConclusao;
    if (input.estimativaHoras !== undefined) updateData.estimativa_horas = input.estimativaHoras;
    if (input.horasRegistradas !== undefined) updateData.horas_registradas = input.horasRegistradas;

    const { data, error } = await db.from(TABLE).update(updateData).eq("id", id).select().single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", `Tarefa com ID ${id} não encontrada`));
      }
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaTarefa(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao atualizar tarefa", undefined, error as Error));
  }
}

export async function deleteTarefa(id: string): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).delete().eq("id", id);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao excluir tarefa", undefined, error as Error));
  }
}

export async function updateKanbanOrder(
  items: UpdateKanbanOrderInput[]
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Atualiza cada tarefa individualmente (batch via Promise.all)
    const updates = items.map((item) =>
      db
        .from(TABLE)
        .update({ status: item.status, ordem_kanban: item.ordemKanban })
        .eq("id", item.tarefaId)
    );

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);

    if (firstError?.error) {
      return err(appError("DATABASE_ERROR", firstError.error.message));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao reordenar tarefas", undefined, error as Error)
    );
  }
}

export async function countTarefasByProject(
  projetoId: string
): Promise<Result<{ total: number; concluidas: number }>> {
  try {
    const db = createDbClient();

    const [totalResult, concluidasResult] = await Promise.all([
      db
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("projeto_id", projetoId)
        .neq("status", "cancelado"),
      db
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("projeto_id", projetoId)
        .eq("status", "concluido"),
    ]);

    return ok({
      total: totalResult.count ?? 0,
      concluidas: concluidasResult.count ?? 0,
    });
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao contar tarefas", undefined, error as Error)
    );
  }
}
