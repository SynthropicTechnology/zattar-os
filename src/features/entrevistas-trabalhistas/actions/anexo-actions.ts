'use server';

import { revalidatePath } from 'next/cache';
import { createAnexoSchema } from '../domain';
import { createAnexo, deleteAnexo } from '../repository';
import type { EntrevistaActionResult } from './entrevista-actions';

// =============================================================================
// UPLOAD ANEXO
// =============================================================================

export async function uploadAnexoAction(
  entrevistaId: number,
  contratoId: number,
  modulo: string,
  noReferencia: string | undefined,
  tipoAnexo: string,
  arquivoUrl: string,
  descricao?: string,
): Promise<EntrevistaActionResult> {
  try {
    const validation = createAnexoSchema.safeParse({
      entrevistaId,
      modulo,
      noReferencia,
      tipoAnexo,
      arquivoUrl,
      descricao,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        message: 'Erro de validação ao enviar anexo',
      };
    }

    const result = await createAnexo(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: result.data,
      message: 'Anexo enviado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao enviar anexo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao enviar anexo. Tente novamente.',
    };
  }
}

// =============================================================================
// EXCLUIR ANEXO
// =============================================================================

export async function deleteAnexoAction(
  anexoId: number,
  contratoId: number,
): Promise<EntrevistaActionResult> {
  try {
    const result = await deleteAnexo(anexoId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: null,
      message: 'Anexo excluído com sucesso',
    };
  } catch (error) {
    console.error('Erro ao excluir anexo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao excluir anexo. Tente novamente.',
    };
  }
}
