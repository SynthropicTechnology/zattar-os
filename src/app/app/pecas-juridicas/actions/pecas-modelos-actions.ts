'use server';

/**
 * PEÇAS JURÍDICAS FEATURE - Server Actions para Modelos
 *
 * Camada de adaptação entre UI e Core para gestão de modelos de peças.
 */

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import {
  type PecaModelo,
  type PecaModeloListItem,
  type CreatePecaModeloInput,
  type UpdatePecaModeloInput,
  type ListarPecasModelosParams,
  type TipoPecaJuridica,
  TIPO_PECA_LABELS,
} from '../domain';
import {
  buscarPecaModelo,
  listarPecasModelos,
  criarPecaModelo,
  atualizarPecaModelo,
  deletarPecaModelo,
} from '../service';
import type { PaginatedResponse } from '@/types';

// =============================================================================
// TIPOS DE RETORNO
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// CRUD ACTIONS
// =============================================================================

/**
 * Busca um modelo de peça por ID
 */
export async function actionBuscarPecaModelo(id: number): Promise<ActionResult<PecaModelo | null>> {
  try {
    const result = await buscarPecaModelo(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Modelo carregado com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Lista modelos de peças com filtros
 */
export async function actionListarPecasModelos(
  params: ListarPecasModelosParams
): Promise<ActionResult<PaginatedResponse<PecaModeloListItem>>> {
  try {
    const result = await listarPecasModelos(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Modelos listados com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Cria um novo modelo de peça
 */
export async function actionCriarPecaModelo(
  input: CreatePecaModeloInput
): Promise<ActionResult<PecaModelo>> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;

    const result = await criarPecaModelo(input, userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        errors: result.error.details?.errors as Record<string, string[]> | undefined,
        message: result.error.message,
      };
    }

    revalidatePath('/app/pecas-juridicas');

    return {
      success: true,
      data: result.data,
      message: 'Modelo criado com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza um modelo de peça existente
 */
export async function actionAtualizarPecaModelo(
  id: number,
  input: UpdatePecaModeloInput
): Promise<ActionResult<PecaModelo>> {
  try {
    const result = await atualizarPecaModelo(id, input);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        errors: result.error.details?.errors as Record<string, string[]> | undefined,
        message: result.error.message,
      };
    }

    revalidatePath('/app/pecas-juridicas');
    revalidatePath(`/app/pecas-juridicas/${id}`);

    return {
      success: true,
      data: result.data,
      message: 'Modelo atualizado com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta (soft delete) um modelo de peça
 */
export async function actionDeletarPecaModelo(id: number): Promise<ActionResult<void>> {
  try {
    const result = await deletarPecaModelo(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    revalidatePath('/app/pecas-juridicas');

    return {
      success: true,
      data: undefined,
      message: 'Modelo excluído com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Retorna opções de tipos de peça para selects
 */
export async function actionGetTiposPecaOptions(): Promise<
  ActionResult<Array<{ value: TipoPecaJuridica; label: string }>>
> {
  const options = Object.entries(TIPO_PECA_LABELS).map(([value, label]) => ({
    value: value as TipoPecaJuridica,
    label,
  }));

  return {
    success: true,
    data: options,
    message: 'Opções carregadas',
  };
}
