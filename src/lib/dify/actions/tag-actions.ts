'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import {
  criarTagSchema,
  atualizarTagSchema,
  deletarTagSchema,
  vincularTagDatasetSchema,
  desvincularTagDatasetSchema,
} from '../domain';

// ---------------------------------------------------------------------------
// Tag Actions
// ---------------------------------------------------------------------------

export const actionListarTagsDify = authenticatedAction(
  z.object({
    tipo: z.string().optional(),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarTags(data.tipo);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionCriarTagDify = authenticatedAction(
  criarTagSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.criarTag({ nome: data.nome, tipo: data.tipo });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionAtualizarTagDify = authenticatedAction(
  atualizarTagSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.atualizarTag(data.tagId, data.nome);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarTagDify = authenticatedAction(
  deletarTagSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.deletarTag(data.tagId);

    if (result.isErr()) throw new Error(result.error.message);
    return { success: true };
  }
);

export const actionVincularTagDatasetDify = authenticatedAction(
  vincularTagDatasetSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.vincularTagDataset(data.datasetId, data.tagIds);

    if (result.isErr()) throw new Error(result.error.message);
    return { success: true };
  }
);

export const actionListarTagsDatasetDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarTagsDataset(data.datasetId);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDesvincularTagDatasetDify = authenticatedAction(
  desvincularTagDatasetSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.desvincularTagDataset(data.datasetId, data.tagId);

    if (result.isErr()) throw new Error(result.error.message);
    return { success: true };
  }
);
