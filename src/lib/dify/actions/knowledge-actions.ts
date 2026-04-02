'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import {
  criarDatasetSchema,
  criarDocumentoSchema,
  buscarDatasetSchema,
  atualizarDocumentoTextoSchema,
  atualizarStatusDocumentosSchema,
} from '../domain';

// ---------------------------------------------------------------------------
// Knowledge Base Actions
// ---------------------------------------------------------------------------

export const actionCriarDatasetDify = authenticatedAction(
  criarDatasetSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.criarDataset(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarDatasetsDify = authenticatedAction(
  z.object({
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarDatasets(data.pagina, data.limite);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionCriarDocumentoDify = authenticatedAction(
  criarDocumentoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.criarDocumento(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarDocumentosDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarDocumentos(data.datasetId, data.pagina, data.limite);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

// ---------------------------------------------------------------------------
// Knowledge Base Extended Actions
// ---------------------------------------------------------------------------

export const actionBuscarDatasetDify = authenticatedAction(
  buscarDatasetSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.buscarDataset(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionObterDetalheDocumentoDify = authenticatedAction(
  z.object({
    documentId: z.string().min(1, 'ID do documento é obrigatório'),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.obterDetalheDocumento(data.documentId);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionAtualizarDocumentoTextoDify = authenticatedAction(
  atualizarDocumentoTextoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.atualizarDocumentoTexto(data.documentId, {
      nome: data.nome,
      texto: data.texto,
    });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionObterStatusEmbeddingDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1),
    batch: z.string().min(1),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.obterStatusEmbedding(data.datasetId, data.batch);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionAtualizarStatusDocumentosDify = authenticatedAction(
  atualizarStatusDocumentosSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.atualizarStatusDocumentos(data.documentIds, data.habilitado);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarDocumentoDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1),
    documentId: z.string().min(1),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.deletarDocumento(data.datasetId, data.documentId);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
