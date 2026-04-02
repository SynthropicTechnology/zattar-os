'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import {
  criarAnotacaoSchema,
  atualizarAnotacaoSchema,
  deletarAnotacaoSchema,
  habilitarRespostaAnotacaoSchema,
} from '../domain';

// ---------------------------------------------------------------------------
// Annotation Actions
// ---------------------------------------------------------------------------

export const actionListarAnotacoesDify = authenticatedAction(
  z.object({
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.listarAnotacoes(data.pagina, data.limite);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionCriarAnotacaoDify = authenticatedAction(
  criarAnotacaoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.criarAnotacao({
      pergunta: data.pergunta,
      resposta: data.resposta,
    });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionAtualizarAnotacaoDify = authenticatedAction(
  atualizarAnotacaoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.atualizarAnotacao(data.anotacaoId, {
      pergunta: data.pergunta,
      resposta: data.resposta,
    });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarAnotacaoDify = authenticatedAction(
  deletarAnotacaoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.deletarAnotacao(data.anotacaoId);

    if (result.isErr()) throw new Error(result.error.message);
    return { success: true };
  }
);

export const actionHabilitarRespostaAnotacaoDify = authenticatedAction(
  habilitarRespostaAnotacaoSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.habilitarRespostaAnotacao({
      embeddingProviderName: data.embeddingProviderName,
      embeddingModelName: data.embeddingModelName,
      scoreThreshold: data.scoreThreshold ?? 0.7,
    });

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDesabilitarRespostaAnotacaoDify = authenticatedAction(
  z.object({}),
  async (_data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.desabilitarRespostaAnotacao();

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionObterStatusRespostaAnotacaoDify = authenticatedAction(
  z.object({
    action: z.enum(['enable', 'disable']),
    jobId: z.string().min(1),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.obterStatusRespostaAnotacao(data.action, data.jobId);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
