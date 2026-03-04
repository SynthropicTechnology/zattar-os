"use server";

import { revalidatePath } from "next/cache";
import { type Result, err, appError } from "@/types/result";
import { getCurrentUser } from "@/lib/auth/server";
import type { Lembrete, CreateLembreteInput } from "../domain";
import * as reminderService from "../services/reminder.service";

const PM_PATH = "/app/project-management";

export async function actionListarLembretes(
  options?: { concluido?: boolean; limite?: number }
): Promise<Result<Lembrete[]>> {
  const user = await getCurrentUser();
  if (!user) return err(appError("UNAUTHORIZED", "Usuário não autenticado"));

  return reminderService.listarLembretes(user.id, options);
}

export async function actionCriarLembrete(
  input: CreateLembreteInput
): Promise<Result<Lembrete>> {
  const user = await getCurrentUser();
  if (!user) return err(appError("UNAUTHORIZED", "Usuário não autenticado"));

  const result = await reminderService.criarLembrete(input, user.id);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionConcluirLembrete(
  id: string,
  concluido: boolean
): Promise<Result<void>> {
  const user = await getCurrentUser();
  if (!user) return err(appError("UNAUTHORIZED", "Usuário não autenticado"));

  const result = await reminderService.concluirLembrete(id, concluido, user.id);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}

export async function actionExcluirLembrete(id: string): Promise<Result<void>> {
  const user = await getCurrentUser();
  if (!user) return err(appError("UNAUTHORIZED", "Usuário não autenticado"));

  const result = await reminderService.excluirLembrete(id, user.id);

  if (result.success) {
    revalidatePath(PM_PATH);
  }

  return result;
}
