'use server';

import { revalidatePath } from 'next/cache';
import type { PaginatedResponse } from '@/types';
import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  UpsertRepresentantePorCPFParams,
  Representante,
} from '../types/representantes';
import * as service from '../service';

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function actionListarRepresentantes(
  params: ListarRepresentantesParams & { incluirEndereco?: boolean; incluirProcessos?: boolean }
): Promise<ActionResponse<PaginatedResponse<Representante>>> {
  try {
    const incluirEndereco = params.incluirEndereco ?? false;
    const incluirProcessos = params.incluirProcessos ?? false;

    const { incluirEndereco: _, incluirProcessos: __, ...listParams } = params;

    const result = incluirProcessos
      ? await service.listarRepresentantesComEnderecoEProcessos(listParams)
      : incluirEndereco
        ? await service.listarRepresentantesComEndereco(listParams)
        : await service.listarRepresentantes(listParams);

    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantePorId(
  id: number,
  opts?: { incluirEndereco?: boolean }
): Promise<ActionResponse<unknown>> {
  try {
    const incluirEndereco = opts?.incluirEndereco ?? false;
    const result = incluirEndereco
      ? await service.buscarRepresentantePorIdComEndereco(id)
      : await service.buscarRepresentantePorId(id);

    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarRepresentante(
  params: CriarRepresentanteParams
): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.criarRepresentante(params);
    if (result.success) {
      revalidatePath('/app/partes');
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.atualizarRepresentante(params);
    if (result.success) {
      revalidatePath('/app/partes');
      revalidatePath(`/app/partes/representantes/${params.id}`);
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarRepresentante(id: number): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.deletarRepresentante(id);
    if (result.success) {
      revalidatePath('/app/partes');
      return { success: true, data: undefined };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Exclui múltiplos representantes em massa (hard delete permanente)
 */
export async function actionDeletarRepresentantesEmMassa(ids: number[]) {
  try {
    const result = await service.deletarRepresentantesEmMassa(ids);
    if (!result.success) {
      return { success: false, message: result.error.message };
    }
    revalidatePath('/app/partes/representantes');
    revalidatePath('/app/partes');
    return {
      success: true,
      message: `${result.data} representante${result.data > 1 ? 's' : ''} excluído${result.data > 1 ? 's' : ''} com sucesso`,
    };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function actionUpsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.upsertRepresentantePorCPF(params);
    if (result.success) {
      revalidatePath('/app/partes');
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantePorNome(nome: string): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.buscarRepresentantePorNome(nome);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<ActionResponse<unknown>> {
  try {
    const result = await service.buscarRepresentantesPorOAB(params);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


