import { err, appError, type Result } from "@/types/result";
import { type Lembrete, type CreateLembreteInput, createLembreteSchema } from "../domain";
import * as reminderRepo from "../repositories/reminder.repository";

export async function listarLembretes(
  usuarioId: number,
  options?: { concluido?: boolean; limite?: number }
): Promise<Result<Lembrete[]>> {
  return reminderRepo.listLembretesByUser(usuarioId, options);
}

export async function criarLembrete(
  input: CreateLembreteInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  const validation = createLembreteSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos")
    );
  }

  return reminderRepo.saveLembrete(validation.data, usuarioId);
}

export async function concluirLembrete(
  id: string,
  concluido: boolean,
  usuarioId: number
): Promise<Result<void>> {
  return reminderRepo.toggleLembreteComplete(id, concluido, usuarioId);
}

export async function excluirLembrete(id: string, usuarioId: number): Promise<Result<void>> {
  return reminderRepo.deleteLembrete(id, usuarioId);
}
