import { createDbClient } from "@/lib/supabase";
import { ok, err, appError, type Result } from "@/types/result";
import { type Lembrete, type CreateLembreteInput, converterParaLembrete } from "../domain";

const TABLE = "pm_lembretes";

export async function listLembretesByUser(
  usuarioId: number,
  options?: { concluido?: boolean; limite?: number }
): Promise<Result<Lembrete[]>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE)
      .select(
        `*,
        projeto:pm_projetos!pm_lembretes_projeto_id_fkey(nome),
        tarefa:pm_tarefas!pm_lembretes_tarefa_id_fkey(titulo)`
      )
      .eq("usuario_id", usuarioId)
      .order("data_hora", { ascending: true });

    if (options?.concluido !== undefined) {
      query = query.eq("concluido", options.concluido);
    }

    if (options?.limite) {
      query = query.limit(options.limite);
    }

    const { data, error } = await query;

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    const lembretes = (data ?? []).map((row) => {
      const flat = {
        ...row,
        projeto_nome: row.projeto?.nome,
        tarefa_titulo: row.tarefa?.titulo,
      };
      return converterParaLembrete(flat as Record<string, unknown>);
    });

    return ok(lembretes);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar lembretes", undefined, error as Error));
  }
}

export async function saveLembrete(
  input: CreateLembreteInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        projeto_id: input.projetoId ?? null,
        tarefa_id: input.tarefaId ?? null,
        usuario_id: usuarioId,
        texto: input.texto,
        data_hora: input.dataHora,
        prioridade: input.prioridade,
      })
      .select()
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(converterParaLembrete(data as Record<string, unknown>));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar lembrete", undefined, error as Error));
  }
}

export async function toggleLembreteComplete(
  id: string,
  concluido: boolean,
  usuarioId: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).update({ concluido }).eq("id", id).eq("usuario_id", usuarioId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError("DATABASE_ERROR", "Erro ao atualizar lembrete", undefined, error as Error)
    );
  }
}

export async function deleteLembrete(id: string, usuarioId: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).delete().eq("id", id).eq("usuario_id", usuarioId);

    if (error) {
      return err(appError("DATABASE_ERROR", error.message));
    }

    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao excluir lembrete", undefined, error as Error));
  }
}
