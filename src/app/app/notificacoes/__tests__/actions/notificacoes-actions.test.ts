/**
 * Testes Unitários - Notificações Actions
 */

import {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "../../actions/notificacoes-actions";
import * as service from "../../service";
import { ok, err as _err, appError as _appError } from "@/types";

// Mock do service
jest.mock("../../service");

// Mock do safe-action
jest.mock("@/lib/safe-action", () => ({
  authenticatedAction: jest.fn((schema, handler) => {
    return async (input: any) => {
      try {
        // Simular validação do schema
        const validation = schema.safeParse(input);
        if (!validation.success) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: validation.error.errors[0].message,
            },
          };
        }

        // Executar handler
        return await handler(validation.data, {
          user: { id: "test-user-id" },
          usuario: { id: 1 },
        });
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: error instanceof Error ? error.message : "Erro desconhecido",
          },
        };
      }
    };
  }),
}));

describe("Notificações Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("actionListarNotificacoes", () => {
    it("deve listar notificações com sucesso", async () => {
      const mockData = {
        notificacoes: [],
        total: 0,
        pagina: 1,
        limite: 20,
        total_paginas: 0,
      };

      (service.listarNotificacoes as jest.Mock).mockResolvedValue(
        ok(mockData)
      );

      const result = await actionListarNotificacoes({
        pagina: 1,
        limite: 20,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data?.success) {
        expect(result.data.data.total).toBe(0);
      }
    });
  });

  describe("actionContarNotificacoesNaoLidas", () => {
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

      (service.contarNotificacoesNaoLidas as jest.Mock).mockResolvedValue(
        ok(mockContador)
      );

      const result = await actionContarNotificacoesNaoLidas({});

      expect(result.success).toBe(true);
      if (result.success && result.data?.success) {
        expect(result.data.data.total).toBe(5);
      }
    });
  });

  describe("actionMarcarNotificacaoComoLida", () => {
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

      (service.marcarNotificacaoComoLida as jest.Mock).mockResolvedValue(
        ok(mockNotificacao)
      );

      const result = await actionMarcarNotificacaoComoLida({ id: 1 });

      expect(result.success).toBe(true);
      if (result.success && result.data?.success) {
        expect(result.data.data.lida).toBe(true);
      }
    });
  });

  describe("actionMarcarTodasComoLidas", () => {
    it("deve marcar todas as notificações como lidas com sucesso", async () => {
      (service.marcarTodasComoLidas as jest.Mock).mockResolvedValue(ok(10));

      const result = await actionMarcarTodasComoLidas({});

      expect(result.success).toBe(true);
      if (result.success && result.data?.success) {
        expect(result.data.data).toBe(10);
      }
    });
  });
});

