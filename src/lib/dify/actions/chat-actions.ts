'use server';

import { createClient } from '@/lib/supabase/server';
import { DifyService } from '../service';
import { enviarMensagemSchema, feedbackSchema } from '../domain';
import { difyRepository } from '../repository';
import { z } from 'zod';

export async function actionEnviarMensagemDify(params: z.infer<typeof enviarMensagemSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const parseResult = enviarMensagemSchema.safeParse(params);
  if (!parseResult.success) {
    return { error: 'Parâmetros inválidos', details: parseResult.error.format() };
  }

  // TODO: Obter appKey específica se necessário, ou usar padrão
  const difyServiceResult = DifyService.create(process.env.DIFY_CHAT_APP_KEY);

  if (difyServiceResult.isErr()) {
    return { error: difyServiceResult.error.message };
  }

  const service = difyServiceResult.value;
  const result = await service.enviarMensagem(parseResult.data, user.email || 'anonymous');

  if (result.isErr()) {
    return { error: result.error.message };
  }

  // Persistir conversa se novo conversation_id for gerado
  if (result.value.conversation_id) {
    await difyRepository.salvarConversa({
      conversation_id: result.value.conversation_id,
      usuario_id: user.id,
      app_key: process.env.DIFY_CHAT_APP_KEY || 'default',
      updated_at: Math.floor(Date.now() / 1000),
    });
  }

  return { data: result.value };
}

export async function actionListarConversasDify(limit = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const difyServiceResult = DifyService.create(process.env.DIFY_CHAT_APP_KEY);
  if (difyServiceResult.isErr()) {
    return { error: difyServiceResult.error.message };
  }
  const service = difyServiceResult.value;

  const result = await service.listarConversas({ limite: limit }, user.email || 'anonymous');

  if (result.isErr()) {
    return { error: result.error.message };
  }

  return { data: result.value };
}

export async function actionObterHistoricoDify(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const difyServiceResult = DifyService.create(process.env.DIFY_CHAT_APP_KEY);
  if (difyServiceResult.isErr()) {
    return { error: difyServiceResult.error.message };
  }
  const service = difyServiceResult.value;

  const result = await service.obterHistorico({ conversationId, limite: 50 }, user.email || 'anonymous');

  if (result.isErr()) {
    return { error: result.error.message };
  }

  return { data: result.value };
}

export async function actionEnviarFeedbackDify(params: z.infer<typeof feedbackSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const parseResult = feedbackSchema.safeParse(params);
  if (!parseResult.success) {
    return { error: 'Parâmetros inválidos', details: parseResult.error.format() };
  }

  const difyServiceResult = DifyService.create(process.env.DIFY_CHAT_APP_KEY);
  if (difyServiceResult.isErr()) {
    return { error: difyServiceResult.error.message };
  }
  const service = difyServiceResult.value;

  const result = await service.enviarFeedback(parseResult.data, user.email || 'anonymous');

  if (result.isErr()) {
    return { error: result.error.message };
  }

  return { data: result.value };
}
