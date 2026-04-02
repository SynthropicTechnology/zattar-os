/**
 * Unit Tests for Chatwoot Service Layer
 *
 * Testes para sincronização de conversas, atribuição inteligente e handlers de webhook
 */

import { ok, err, appError } from '../../../types';
import {
  sincronizarConversaChatwoot,
  atribuirConversaInteligente,
  sincronizarAgenteChatwoot,
  atualizarDisponibilidadeAgente,
  processarWebhookConversa,
  processarWebhookAgente,
  processarWebhook,
} from '../service';
import * as repository from '../repository';

// Mock do repositório
jest.mock('../repository', () => ({
  findConversaPorChatwootId: jest.fn(),
  criarConversa: jest.fn(),
  atualizarConversa: jest.fn(),
  findUsuarioPorChatwootId: jest.fn(),
  findUsuarioPorUUID: jest.fn(),
  criarUsuario: jest.fn(),
  atualizarUsuario: jest.fn(),
  atualizarUsuarioPorUUID: jest.fn(),
  listarAgentesDisponíveis: jest.fn(),
}));

// Mock do chatwoot client (isChatwootConfigured is called by webhook handlers)
jest.mock('@/lib/chatwoot', () => ({
  isChatwootConfigured: jest.fn().mockResolvedValue(true),
  getChatwootClient: jest.fn().mockResolvedValue({}),
  createContact: jest.fn(),
  updateContact: jest.fn(),
  getContact: jest.fn(),
  deleteContact: jest.fn(),
  findContactByIdentifier: jest.fn(),
  findContactByEmail: jest.fn(),
  findContactByPhone: jest.fn(),
  listAllContacts: jest.fn(),
  applyParteLabels: jest.fn(),
  getContactConversations: jest.fn(),
  getConversationCounts: jest.fn(),
  getConversationHistory: jest.fn(),
  formatConversationForAI: jest.fn(),
}));

// Mock do supabase
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

describe('Chatwoot Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sincronizarConversaChatwoot', () => {
    it('deve criar nova conversa quando não existe', async () => {
      const mockCreateResult = ok({ id: 1n, criada: true });

      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        ok(null)
      );
      (repository.criarConversa as jest.Mock).mockResolvedValue(mockCreateResult);

      const result = await sincronizarConversaChatwoot({
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
        chatwoot_inbox_id: 456,
        status: 'open',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.criada).toBe(true);
      }
      expect(repository.criarConversa).toHaveBeenCalled();
    });

    it('deve atualizar conversa existente', async () => {
      const existingConversa = {
        id: 1n,
        chatwoot_conversation_id: 123n,
        chatwoot_account_id: 1n,
        status: 'open',
      };

      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        ok(existingConversa)
      );
      (repository.atualizarConversa as jest.Mock).mockResolvedValue(
        ok({ id: 1n })
      );

      const result = await sincronizarConversaChatwoot({
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
        chatwoot_inbox_id: 456,
        status: 'resolved',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.criada).toBe(false);
      }
      expect(repository.atualizarConversa).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ status: 'resolved' })
      );
    });

    it('deve retornar erro se falhar ao buscar conversa existente', async () => {
      const mockError = appError('DATABASE_ERROR', 'Erro ao buscar conversa');

      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        err(mockError)
      );

      const result = await sincronizarConversaChatwoot({
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
        chatwoot_inbox_id: 456,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('atribuirConversaInteligente', () => {
    it('deve atribuir conversa ao agente com menor carga', async () => {
      const mockAgentes = [
        {
          id: 1n,
          usuario_id: 'user-1',
          chatwoot_agent_id: 101n,
          nome_chatwoot: 'Agent 1',
          contador_conversas_ativas: 2,
          disponivel: true,
        },
        {
          id: 2n,
          usuario_id: 'user-2',
          chatwoot_agent_id: 102n,
          nome_chatwoot: 'Agent 2',
          contador_conversas_ativas: 5,
          disponivel: true,
        },
      ];

      (repository.listarAgentesDisponíveis as jest.Mock).mockResolvedValue(
        ok(mockAgentes)
      );
      (repository.atualizarConversa as jest.Mock).mockResolvedValue(
        ok({ id: 1n })
      );

      const result = await atribuirConversaInteligente({
        conversacao_id: 1n,
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agente_id).toBe(101n);
        expect(result.data.nome).toBe('Agent 1');
      }
    });

    it('deve filtrar agentes por habilidades', async () => {
      const mockAgentes = [
        {
          id: 1n,
          usuario_id: 'user-1',
          chatwoot_agent_id: 101n,
          nome_chatwoot: 'Agent 1',
          contador_conversas_ativas: 1,
          disponivel: true,
          habilidades: ['legal', 'fiscal'],
        },
      ];

      (repository.listarAgentesDisponíveis as jest.Mock).mockResolvedValue(
        ok(mockAgentes)
      );

      const result = await atribuirConversaInteligente({
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
        habilidades_requeridas: ['legal'],
      });

      expect(result.success).toBe(true);
      expect(repository.listarAgentesDisponíveis).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ skills: ['legal'] })
      );
    });

    it('deve retornar erro se nenhum agente disponível', async () => {
      (repository.listarAgentesDisponíveis as jest.Mock).mockResolvedValue(
        ok([])
      );

      const result = await atribuirConversaInteligente({
        chatwoot_conversation_id: 123,
        chatwoot_account_id: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Nenhum agente disponível');
      }
    });
  });

  describe('sincronizarAgenteChatwoot', () => {
    it('deve criar novo agente quando não existe', async () => {
      (repository.findUsuarioPorChatwootId as jest.Mock).mockResolvedValue(
        ok(null)
      );
      (repository.criarUsuario as jest.Mock).mockResolvedValue(
        ok({ id: 1n, criado: true })
      );

      const result = await sincronizarAgenteChatwoot({
        chatwoot_agent_id: 101,
        chatwoot_account_id: 1,
        email: 'agent@example.com',
        nome_chatwoot: 'Agent Name',
        role: 'agent',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.criado).toBe(true);
      }
      expect(repository.criarUsuario).toHaveBeenCalled();
    });

    it('deve atualizar agente existente', async () => {
      const existingAgent = {
        id: 1n,
        usuario_id: 'user-1',
        chatwoot_agent_id: 101n,
        email: 'old@example.com',
      };

      (repository.findUsuarioPorChatwootId as jest.Mock).mockResolvedValue(
        ok(existingAgent)
      );
      (repository.atualizarUsuario as jest.Mock).mockResolvedValue(
        ok({ id: 1n, criado: false })
      );

      const result = await sincronizarAgenteChatwoot({
        chatwoot_agent_id: 101,
        chatwoot_account_id: 1,
        email: 'new@example.com',
        nome_chatwoot: 'Updated Name',
        role: 'agent',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.criado).toBe(false);
      }
      expect(repository.atualizarUsuario).toHaveBeenCalled();
    });
  });

  describe('atualizarDisponibilidadeAgente', () => {
    it('deve atualizar disponibilidade do agente', async () => {
      (repository.atualizarUsuarioPorUUID as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await atualizarDisponibilidadeAgente(
        'user-uuid',
        true
      );

      expect(result.success).toBe(true);
      expect(repository.atualizarUsuarioPorUUID).toHaveBeenCalledWith(
        'user-uuid',
        expect.objectContaining({ disponivel: true })
      );
    });

    it('deve definir disponivel_em quando agent fica offline', async () => {
      (repository.atualizarUsuarioPorUUID as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await atualizarDisponibilidadeAgente(
        'user-uuid',
        false
      );

      expect(result.success).toBe(true);
      expect(repository.atualizarUsuarioPorUUID).toHaveBeenCalledWith(
        'user-uuid',
        expect.objectContaining({ disponivel: false })
      );
    });
  });

  describe('processarWebhookConversa', () => {
    it('deve sincronizar conversa criada', async () => {
      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        ok(null)
      );
      (repository.criarConversa as jest.Mock).mockResolvedValue(
        ok({ id: 1n, criada: true })
      );
      (repository.listarAgentesDisponíveis as jest.Mock).mockResolvedValue(
        ok([
          {
            id: 1n,
            usuario_id: 'user-1',
            chatwoot_agent_id: 101n,
            nome_chatwoot: 'Agent',
            contador_conversas_ativas: 0,
            disponivel: true,
          },
        ])
      );
      (repository.atualizarConversa as jest.Mock).mockResolvedValue(
        ok({ id: 1n })
      );

      const result = await processarWebhookConversa('conversation.created', {
        event: 'conversation.created',
        data: {
          id: 123,
          inbox_id: 456,
          status: 'open',
          messages_count: 0,
        },
        account_id: 1,
      });

      expect(result.success).toBe(true);
    });

    it('deve atualizar status quando conversa resolvida', async () => {
      // isChatwootConfigured mock is already set to true
      // atualizarStatusConversa also calls isChatwootConfigured
      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        ok({ id: 1n, chatwoot_conversation_id: 123n, status: 'open' })
      );
      (repository.atualizarConversa as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await processarWebhookConversa('conversation.status_changed', {
        event: 'conversation.status_changed',
        data: {
          id: 123,
          status: 'resolved',
        },
        account_id: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('processarWebhookAgente', () => {
    it('deve atualizar disponibilidade do agente', async () => {
      const mockAgent = {
        id: 1n,
        usuario_id: 'user-1',
        chatwoot_agent_id: 101n,
      };

      (repository.findUsuarioPorChatwootId as jest.Mock).mockResolvedValue(
        ok(mockAgent)
      );
      (repository.atualizarUsuarioPorUUID as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await processarWebhookAgente('agent.status_changed', {
        event: 'agent.status_changed',
        data: {
          id: 101,
          availability_status: 'available',
          presence_status: 'online',
        },
        account_id: 1,
      });

      expect(result.success).toBe(true);
      expect(repository.atualizarUsuarioPorUUID).toHaveBeenCalled();
    });

    it('deve marcar agente como offline quando status_changed para offline', async () => {
      const mockAgent = {
        id: 1n,
        usuario_id: 'user-1',
        chatwoot_agent_id: 101n,
      };

      (repository.findUsuarioPorChatwootId as jest.Mock).mockResolvedValue(
        ok(mockAgent)
      );
      (repository.atualizarUsuarioPorUUID as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await processarWebhookAgente('agent.status_changed', {
        event: 'agent.status_changed',
        data: {
          id: 101,
          availability_status: 'away',
          presence_status: 'offline',
        },
        account_id: 1,
      });

      expect(result.success).toBe(true);
      expect(repository.atualizarUsuarioPorUUID).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ disponivel: false })
      );
    });
  });

  describe('processarWebhook', () => {
    it('deve rotear evento conversation.* para processarWebhookConversa', async () => {
      (repository.findConversaPorChatwootId as jest.Mock).mockResolvedValue(
        ok(null)
      );
      (repository.criarConversa as jest.Mock).mockResolvedValue(
        ok({ id: 1n, criada: true })
      );
      // Need to mock listarAgentesDisponíveis for auto-assignment
      (repository.listarAgentesDisponíveis as jest.Mock).mockResolvedValue(
        ok([])
      );

      const result = await processarWebhook('conversation.created', {
        event: 'conversation.created',
        data: { id: 123, inbox_id: 1 },
        account_id: 1,
      });

      expect(result.success).toBe(true);
    });

    it('deve rotear evento agent.* para processarWebhookAgente', async () => {
      const mockAgent = {
        id: 1n,
        usuario_id: 'user-1',
        chatwoot_agent_id: 101n,
      };

      (repository.findUsuarioPorChatwootId as jest.Mock).mockResolvedValue(
        ok(mockAgent)
      );
      (repository.atualizarUsuarioPorUUID as jest.Mock).mockResolvedValue(
        ok(undefined)
      );

      const result = await processarWebhook('agent.status_changed', {
        event: 'agent.status_changed',
        data: { id: 101 },
        account_id: 1,
      });

      expect(result.success).toBe(true);
    });

    it('deve retornar ok para eventos desconhecidos', async () => {
      const result = await processarWebhook('unknown.event' as any, {
        event: 'unknown.event' as any,
        data: {},
        account_id: 1,
      });

      expect(result.success).toBe(true);
    });
  });
});
