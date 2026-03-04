"use server";

import { revalidatePath } from "next/cache";
import { type Result, type PaginatedResponse } from "@/types/result";
import type {
  Tarefa,
  CreateTarefaInput,
  UpdateTarefaInput,
  UpdateKanbanOrderInput,
  ListarTarefasParams,
} from "../domain";
import * as taskService from "../services/task.service";

const PM_PATH = "/app/project-management";

export async function actionListarTarefasPorProjeto(
  projetoId: string,
  status?: string
): Promise<Result<Tarefa[]>> {
  return taskService.listarTarefasPorProjeto(projetoId, status);
}

export async function actionListarTarefasGlobal(
  params: ListarTarefasParams
): Promise<Result<PaginatedResponse<Tarefa>>> {
  return taskService.listarTarefasGlobal(params);
}

export async function actionCriarTarefa(
  input: CreateTarefaInput,
  criadoPor: number
): Promise<Result<Tarefa>> {
  const result = await taskService.criarTarefa(input, criadoPor);

  if (result.success) {
    revalidatePath(`${PM_PATH}/projects/${input.projetoId}`);
    revalidatePath(`${PM_PATH}/tasks`);
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionAtualizarTarefa(
  id: string,
  input: UpdateTarefaInput,
  projetoId?: string
): Promise<Result<Tarefa>> {
  const result = await taskService.atualizarTarefa(id, input, projetoId);

  if (result.success) {
    if (projetoId) {
      revalidatePath(`${PM_PATH}/projects/${projetoId}`);
    }
    revalidatePath(`${PM_PATH}/tasks`);
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionExcluirTarefa(
  id: string,
  projetoId?: string
): Promise<Result<void>> {
  const result = await taskService.excluirTarefa(id);

  if (result.success) {
    if (projetoId) {
      revalidatePath(`${PM_PATH}/projects/${projetoId}`);
    }
    revalidatePath(`${PM_PATH}/tasks`);
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionReordenarKanban(
  items: UpdateKanbanOrderInput[]
): Promise<Result<void>> {
  const result = await taskService.reordenarKanban(items);

  if (result.success) {
    revalidatePath(`${PM_PATH}/tasks`);
  }

  return result;
}
