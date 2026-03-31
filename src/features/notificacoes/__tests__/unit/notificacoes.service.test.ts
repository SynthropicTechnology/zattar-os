/**
 * Testes Unitários - Notificações Service
 */

import {
  listarNotificacoes,
  contarNotificacoesNaoLidas,
  marcarNotificacaoComoLida,
  marcarTodasComoLidas,
} from "../../service";
import * as repository from "../../repository";
import { appError as _appError } from "../../../../types";

// Mock do repository
jest.mock("../../repository");

// Mock do supabase server client (used by contarNotificacoesNaoLidas for auth)
const mockSupabaseAuth = {
  getUser: jest.fn(),
};
const mockSupabaseFrom = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockSupabaseAuth.getUser(...args),
    },
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}));

// Mock do redis cache utils
jest.mock("@/lib/redis/cache-utils", () => ({
  withCache: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  generateCacheKey: jest.fn().mockReturnValue("test-cache-key"),
  CACHE_PREFIXES: { notificacoes: "notificacoes" },
}));

describe("Notificações Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth for contarNotificacoesNaoLidas
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "auth-user-123" } },
    });
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 1 },
            error: null,
          }),
        }),
      }),
    });
  });

  describe("listarNotificacoes", () => {
    it("deve listar notificações com sucesso", async () => {
      const mockNotificacoes = {
        notificacoes: [
          {
            id: 1,
            usuario_id: 1,
            tipo: "processo_atribuido" as const,
            titulo: "Processo atribuído",
            descricao: "Teste",
            entidade_tipo: "processo" as const,
            entidade_id: 123,
            lida: false,
            lida_em: null,
            dados_adicionais: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        pagina: 1,
        limite: 20,
        total_paginas: 1,
      };

      (repository.listarNotificacoes as jest.Mock).mockResolvedValue(
        mockNotificacoes
      );

      const result = await listarNotificacoes({
        pagina: 1,
        limite: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notificacoes).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("deve validar parâmetros inválidos", async () => {
      const result = await listarNotificacoes({
        pagina: -1, // Inválido
        limite: 20,
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("contarNotificacoesNaoLidas", () => {
    it("deve contar notificações não lidas com sucesso", async () => {
      const mockContador = {
        total: 5,
        por_tipo: {
          processo_atribuido: 2,
          processo_movimentacao: 1,
          audiencia_atribuida: 1,
          audiencia_alterada: 0,
          expediente_atribuido: 1,
          expediente_alterado: 0,
          prazo_vencendo: 0,
          prazo_vencido: 0,
        },
      };

      (repository.contarNotificacoesNaoLidas as jest.Mock).mockResolvedValue(
        mockContador
      );

      const result = await contarNotificacoesNaoLidas();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(5);
        expect(result.data.por_tipo.processo_atribuido).toBe(2);
      }
    });
  });

  describe("marcarNotificacaoComoLida", () => {
    it("deve marcar notificação como lida com sucesso", async () => {
      const mockNotificacao = {
        id: 1,
        usuario_id: 1,
        tipo: "processo_atribuido" as const,
        titulo: "Processo atribuído",
        descricao: "Teste",
        entidade_tipo: "processo" as const,
        entidade_id: 123,
        lida: true,
        lida_em: new Date().toISOString(),
        dados_adicionais: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (repository.marcarNotificacaoComoLida as jest.Mock).mockResolvedValue(
        mockNotificacao
      );

      const result = await marcarNotificacaoComoLida(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lida).toBe(true);
        expect(result.data.lida_em).not.toBeNull();
      }
    });

    it("deve retornar erro para ID inválido", async () => {
      const result = await marcarNotificacaoComoLida(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("marcarTodasComoLidas", () => {
    it("deve marcar todas as notificações como lidas com sucesso", async () => {
      (repository.marcarTodasComoLidas as jest.Mock).mockResolvedValue(10);

      const result = await marcarTodasComoLidas();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(10);
      }
    });
  });
});

