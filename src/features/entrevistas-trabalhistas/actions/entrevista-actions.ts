'use server';

import { revalidatePath } from 'next/cache';
import type { TipoLitigio, PerfilReclamante, ModuloEntrevista } from '../domain';
import {
  iniciarEntrevista,
  salvarModulo,
  finalizarEntrevista,
  reabrirEntrevista,
} from '../service';

// =============================================================================
// TIPOS
// =============================================================================

export type EntrevistaActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

// =============================================================================
// INICIAR ENTREVISTA
// =============================================================================

export async function iniciarEntrevistaAction(
  contratoId: number,
  tipoLitigio: TipoLitigio,
  perfilReclamante?: PerfilReclamante,
  createdBy?: number | null,
): Promise<EntrevistaActionResult> {
  try {
    const result = await iniciarEntrevista({
      contratoId,
      tipoLitigio,
      perfilReclamante,
      createdBy,
    });

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
      message: 'Entrevista iniciada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao iniciar entrevista:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao iniciar entrevista. Tente novamente.',
    };
  }
}

// =============================================================================
// SALVAR MÓDULO
// =============================================================================

export async function salvarModuloAction(
  entrevistaId: number,
  contratoId: number,
  modulo: ModuloEntrevista,
  respostasModulo: Record<string, unknown>,
  avancar: boolean = false,
  notaOperador?: string,
): Promise<EntrevistaActionResult> {
  try {
    const result = await salvarModulo(
      entrevistaId,
      modulo,
      respostasModulo,
      avancar,
      notaOperador,
    );

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
      message: avancar ? 'Módulo salvo, avançando...' : 'Rascunho salvo',
    };
  } catch (error) {
    console.error('Erro ao salvar módulo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao salvar módulo. Tente novamente.',
    };
  }
}

// =============================================================================
// FINALIZAR ENTREVISTA
// =============================================================================

export async function finalizarEntrevistaAction(
  entrevistaId: number,
  contratoId: number,
  testemunhasMapeadas: boolean,
): Promise<EntrevistaActionResult> {
  try {
    const result = await finalizarEntrevista(entrevistaId, testemunhasMapeadas);

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
      message: 'Entrevista finalizada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao finalizar entrevista:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao finalizar entrevista. Tente novamente.',
    };
  }
}

// =============================================================================
// REABRIR ENTREVISTA
// =============================================================================

export async function reabrirEntrevistaAction(
  entrevistaId: number,
  contratoId: number,
): Promise<EntrevistaActionResult> {
  try {
    const result = await reabrirEntrevista(entrevistaId);

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
      message: 'Entrevista reaberta para edição',
    };
  } catch (error) {
    console.error('Erro ao reabrir entrevista:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao reabrir entrevista. Tente novamente.',
    };
  }
}
