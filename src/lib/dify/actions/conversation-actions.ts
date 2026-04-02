'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import { renomearConversaSchema, deletarConversaSchema } from '../domain';

// ---------------------------------------------------------------------------
// Conversation Management Actions
// ---------------------------------------------------------------------------

export const actionRenomearConversaDify = authenticatedAction(
  renomearConversaSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.renomearConversa(
      {
        conversationId: data.conversationId,
        nome: data.nome,
        autoGenerate: data.autoGenerate,
      },
      user.emailCorporativo || 'anonymous'
    );

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarConversaDify = authenticatedAction(
  deletarConversaSchema,
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.deletarConversa(
      data.conversationId,
      user.emailCorporativo || 'anonymous'
    );

    if (result.isErr()) throw new Error(result.error.message);
    return { success: true };
  }
);

export const actionObterVariaveisConversaDify = authenticatedAction(
  z.object({
    conversationId: z.string().min(1, 'ID da conversa é obrigatório'),
  }),
  async (data, { user }) => {
    const { DifyService } = await import('../service');
    const service = await DifyService.createAsync(String(user.id));
    const result = await service.obterVariaveisConversa(
      data.conversationId,
      user.emailCorporativo || 'anonymous'
    );

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
