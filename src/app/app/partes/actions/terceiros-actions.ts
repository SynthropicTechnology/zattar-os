'use server';

/**
 * Server Actions para Terceiros
 *
 * Utiliza wrapper safe-action para:
 * - Autenticacao automatica
 * - Validacao com Zod
 * - Tipagem forte
 * - Error handling consistente
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  authenticatedAction,
  authenticatedFormAction,
} from '@/lib/safe-action';
import {
  createTerceiroSchema,
  updateTerceiroSchema,
  type CreateTerceiroInput,
  type UpdateTerceiroInput,
  type ListarTerceirosParams,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const listarTerceirosSchema = z.object({
  pagina: z.number().min(1).optional().default(1),
  limite: z.number().min(1).max(100).optional().default(20),
  busca: z.string().optional(),
  tipo_pessoa: z.enum(['pf', 'pj']).optional(),
  tipo_parte: z.enum(['PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE', 'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE', 'OUTRO']).optional(),
  polo: z.enum(['ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO']).optional(),
  ativo: z.boolean().optional(),
  ordenarPor: z.string().optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
});

const idSchema = z.object({
  id: z.number().min(1, 'ID invalido'),
});

// =============================================================================
// ACTIONS DE LEITURA (safe-action)
// =============================================================================

/**
 * Lista terceiros com paginacao e filtros
 */
export const actionListarTerceirosSafe = authenticatedAction(
  listarTerceirosSchema,
  async (params) => {
    const result = await service.listarTerceiros(params as ListarTerceirosParams);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca um terceiro pelo ID
 */
export const actionBuscarTerceiroSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.buscarTerceiro(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    if (!result.data) {
      throw new Error('Terceiro nao encontrado');
    }
    return result.data;
  }
);

// =============================================================================
// ACTIONS DE ESCRITA (safe-action)
// =============================================================================

/**
 * Cria um novo terceiro (para uso com useActionState)
 */
export const actionCriarTerceiroSafe = authenticatedFormAction(
  createTerceiroSchema,
  async (data) => {
    const result = await service.criarTerceiro(data as CreateTerceiroInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/terceiros');
    revalidatePath('/app/partes');
    return result.data;
  }
);

/**
 * Atualiza um terceiro existente
 */
export const actionAtualizarTerceiroSafe = authenticatedAction(
  z.object({
    id: z.number().min(1),
    data: updateTerceiroSchema,
  }),
  async ({ id, data }) => {
    const result = await service.atualizarTerceiro(id, data as UpdateTerceiroInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/terceiros');
    revalidatePath(`/app/partes/terceiros/${id}`);
    revalidatePath('/app/partes');
    return result.data;
  }
);

// =============================================================================
// AÇÕES EM MASSA
// =============================================================================

/**
 * Desativa múltiplos terceiros em massa (soft delete)
 */
export async function actionDesativarTerceirosEmMassa(ids: number[]) {
  try {
    const result = await service.desativarTerceirosEmMassa(ids);
    if (!result.success) {
      return { success: false, message: result.error.message };
    }
    revalidatePath('/app/partes/terceiros');
    revalidatePath('/app/partes');
    return {
      success: true,
      message: `${result.data} terceiro${result.data > 1 ? 's' : ''} desativado${result.data > 1 ? 's' : ''} com sucesso`,
    };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// Serao removidos apos atualizacao de todos os consumidores
// =============================================================================

export async function actionListarTerceiros(params: ListarTerceirosParams = {}) {
  try {
    const result = await service.listarTerceiros(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarTerceiro(id: number) {
  try {
    const result = await service.buscarTerceiro(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Terceiro nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarTerceiro(id: number, input: Parameters<typeof service.atualizarTerceiro>[1]) {
  try {
    const result = await service.atualizarTerceiro(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/app/partes');
    revalidatePath(`/app/partes/terceiros/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
