/**
 * Registro de Ferramentas MCP - Chat
 *
 * Tools disponíveis:
 * - listar_salas: Lista salas de chat
 * - enviar_mensagem: Envia mensagem
 * - buscar_historico: Busca histórico de mensagens
 * - criar_grupo: Cria grupo de chat
 * - iniciar_chamada: Inicia chamada de vídeo
 * - buscar_historico_chamadas: Busca histórico de chamadas
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Chat
 */
export async function registerChatTools(): Promise<void> {
  const {
    actionListarSalas,
    actionEnviarMensagem,
    actionBuscarHistorico,
    actionCriarGrupo,
  } = await import('@/app/(authenticated)/chat/actions/chat-actions');

  const {
    actionIniciarChamada,
    actionBuscarHistoricoChamadas,
  } = await import('@/app/(authenticated)/chat/actions/chamadas-actions');

  const { TipoSalaChat, TipoChamada } = await import('@/app/(authenticated)/chat/domain');

  /**
   * Lista salas de chat disponíveis para o usuário
   */
  registerMcpTool({
    name: 'listar_salas',
    description: 'Lista salas de chat disponíveis para o usuário',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de salas'),
      tipo: z.nativeEnum(TipoSalaChat).optional().describe('Tipo de sala'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarSalas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar salas');
      }
    },
  });

  /**
   * Envia mensagem em uma sala de chat
   */
  registerMcpTool({
    name: 'enviar_mensagem',
    description: 'Envia mensagem em uma sala de chat',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      conteudo: z.string().min(1).describe('Conteúdo da mensagem'),
      tipo: z
        .enum(['texto', 'arquivo', 'imagem', 'video', 'audio', 'sistema'])
        .default('texto')
        .describe('Tipo da mensagem'),
      data: z.record(z.string(), z.unknown()).optional().describe('Metadados opcionais da mensagem'),
    }),
    handler: async (args) => {
      try {
        const result = await actionEnviarMensagem(args.salaId, args.conteudo, args.tipo, args.data ?? null);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      }
    },
  });

  /**
   * Busca histórico de mensagens de uma sala
   */
  registerMcpTool({
    name: 'buscar_historico',
    description: 'Busca histórico de mensagens de uma sala',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de mensagens'),
      antes: z.string().optional().describe('Buscar mensagens antes desta data (ISO)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarHistorico(args.salaId, args.limite, args.antes);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar histórico');
      }
    },
  });

  /**
   * Cria novo grupo de chat
   */
  registerMcpTool({
    name: 'criar_grupo',
    description: 'Cria novo grupo de chat',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      nome: z.string().min(1).describe('Nome do grupo'),
      membros: z.array(z.number()).min(1).describe('IDs dos membros iniciais'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarGrupo(args.nome, args.membros);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar grupo');
      }
    },
  });

  /**
   * Inicia chamada de vídeo/áudio
   */
  registerMcpTool({
    name: 'iniciar_chamada',
    description: 'Inicia chamada de vídeo/áudio',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      tipo: z.enum(['video', 'audio']).describe('Tipo de chamada'),
    }),
    handler: async (args) => {
      try {
        const tipo = args.tipo === 'video' ? TipoChamada.Video : TipoChamada.Audio;
        const result = await actionIniciarChamada(args.salaId, tipo);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao iniciar chamada');
      }
    },
  });

  /**
   * Busca histórico de chamadas
   */
  registerMcpTool({
    name: 'buscar_historico_chamadas',
    description: 'Busca histórico de chamadas',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarHistoricoChamadas(args.salaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar histórico de chamadas');
      }
    },
  });
}
