'use server';

import { revalidatePath } from 'next/cache';
import { authenticatedAction } from '@/lib/safe-action';
import {
  criarProcessoWorkspaceAnotacaoSchema,
  deletarProcessoWorkspaceAnotacaoSchema,
  listarProcessoWorkspaceAnotacoesSchema,
} from '../workspace-annotations-domain';
import {
  createProcessoWorkspaceAnnotation,
  deleteProcessoWorkspaceAnnotation,
  listProcessoWorkspaceAnnotations,
} from '../workspace-annotations.repository';

export const actionListarProcessoWorkspaceAnotacoes = authenticatedAction(
  listarProcessoWorkspaceAnotacoesSchema,
  async (data, { user }) => {
    const result = await listProcessoWorkspaceAnnotations(user.id, data.processoId);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

export const actionCriarProcessoWorkspaceAnotacao = authenticatedAction(
  criarProcessoWorkspaceAnotacaoSchema,
  async (data, { user }) => {
    const result = await createProcessoWorkspaceAnnotation(user.id, {
      ...data,
      anchor: data.anchor ?? {},
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }

    revalidatePath('/app/processos');
    revalidatePath(`/app/processos/${data.processoId}`);

    return result.data;
  }
);

export const actionDeletarProcessoWorkspaceAnotacao = authenticatedAction(
  deletarProcessoWorkspaceAnotacaoSchema,
  async (data, { user }) => {
    const result = await deleteProcessoWorkspaceAnnotation(user.id, data.annotationId);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    revalidatePath('/app/processos');
    revalidatePath(`/app/processos/${data.processoId}`);

    return { success: true };
  }
);