'use server';

import { authenticatedAction } from '@/lib/safe-action';
import {
  criarSegmentosSchema,
  atualizarSegmentoSchema,
  deletarSegmentoSchema,
} from '../domain';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Segment Actions
// ---------------------------------------------------------------------------

export const actionListarSegmentosDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1),
    documentId: z.string().min(1),
    keyword: z.string().optional(),
    status: z.string().optional(),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarSegmentos(data.datasetId, data.documentId, {
      keyword: data.keyword,
      status: data.status,
    });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionCriarSegmentosDify = authenticatedAction(
  criarSegmentosSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.criarSegmentos(
      data.datasetId,
      data.documentId,
      data.segmentos
    );

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionAtualizarSegmentoDify = authenticatedAction(
  atualizarSegmentoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.atualizarSegmento(
      data.datasetId,
      data.documentId,
      data.segmentId,
      {
        content: data.content,
        answer: data.answer,
        keywords: data.keywords,
        enabled: data.enabled,
      }
    );

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarSegmentoDify = authenticatedAction(
  deletarSegmentoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.deletarSegmento(
      data.datasetId,
      data.documentId,
      data.segmentId
    );

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
