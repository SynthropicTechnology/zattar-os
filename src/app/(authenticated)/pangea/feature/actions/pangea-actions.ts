'use server';

import { requireAuth } from '@/app/(authenticated)/usuarios';
import type { PangeaBuscaInput } from '../domain';
import { buscarPrecedentes, listarOrgaosDisponiveis } from '../service';

export async function actionListarOrgaosPangeaDisponiveis() {
  try {
    await requireAuth(['pangea:listar']);
    const data = await listarOrgaosDisponiveis();
    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao listar órgãos do Pangea',
    };
  }
}

export async function actionBuscarPrecedentesPangea(input: PangeaBuscaInput) {
  try {
    await requireAuth(['pangea:listar']);
    const data = await buscarPrecedentes(input);
    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao buscar precedentes no Pangea',
    };
  }
}


