"use server";

import { revalidatePath } from "next/cache";
import { type Result } from "@/types/result";
import type { MembroProjeto, AddMembroInput, PapelProjeto } from "../domain";
import * as teamService from "../services/team.service";

const PM_PATH = "/app/project-management";

export async function actionListarMembros(
  projetoId: string
): Promise<Result<MembroProjeto[]>> {
  return teamService.listarMembros(projetoId);
}

export async function actionAdicionarMembro(
  input: AddMembroInput
): Promise<Result<MembroProjeto>> {
  const result = await teamService.adicionarMembro(input);

  if (result.success) {
    revalidatePath(`${PM_PATH}/projects/${input.projetoId}`);
  }

  return result;
}

export async function actionRemoverMembro(
  membroId: string,
  projetoId: string
): Promise<Result<void>> {
  const result = await teamService.removerMembro(membroId, projetoId);

  if (result.success) {
    revalidatePath(`${PM_PATH}/projects/${projetoId}`);
  }

  return result;
}

export async function actionAlterarPapel(
  membroId: string,
  papel: PapelProjeto,
  projetoId?: string
): Promise<Result<MembroProjeto>> {
  const result = await teamService.alterarPapel(membroId, papel);

  if (result.success && projetoId) {
    revalidatePath(`${PM_PATH}/projects/${projetoId}`);
  }

  return result;
}
