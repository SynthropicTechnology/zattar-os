/**
 * @jest-environment jsdom
 */

/**
 * Testes Unitários - useNotificacoesRealtime Hook
 *
 * Testes para o hook de Realtime de notificações, incluindo:
 * - Estados de subscription (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT)
 * - Retry com backoff exponencial
 * - Channel cleanup
 * - Fallback para polling
 * - Callbacks em novos payloads
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

// Mock das actions
jest.mock("../../actions/notificacoes-actions", () => ({
  actionContarNotificacoesNaoLidas: jest.fn(),
  actionListarNotificacoes: jest.fn(),
  actionMarcarNotificacaoComoLida: jest.fn(),
  actionMarcarTodasComoLidas: jest.fn(),
}));

// Mock do version module
jest.mock("@/lib/version", () => ({
  checkVersionMismatch: jest.fn(),
  isServerActionVersionError: jest.fn().mockReturnValue(false),
  handleVersionMismatchError: jest.fn(),
}));

// Mock do cliente Supabase
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();
const mockGetChannels = jest.fn().mockReturnValue([]);
const mockOn = jest.fn().mockReturnThis();
const mockChannel = jest.fn().mockReturnValue({
  on: mockOn,
  subscribe: mockSubscribe,
});
const mockRealtimeSetAuth = jest.fn();

const mockAuthOnAuthStateChangeUnsubscribe = jest.fn();
const mockAuthOnAuthStateChange = jest.fn().mockReturnValue({
  data: {
    subscription: {
      unsubscribe: mockAuthOnAuthStateChangeUnsubscribe,
    },
  },
});

const mockAuthGetUser = jest.fn();
const mockAuthGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: mockAuthGetUser,
      getSession: mockAuthGetSession,
      onAuthStateChange: mockAuthOnAuthStateChange,
    },
    from: mockFrom,
    channel: mockChannel,
    getChannels: mockGetChannels,
    removeChannel: mockRemoveChannel,
    realtime: {
      setAuth: mockRealtimeSetAuth,
    },
  }),
}));

// Importar hook após mocks
import { useNotificacoesRealtime } from "../../hooks/use-notificacoes";
import {
  actionContarNotificacoesNaoLidas,
  actionListarNotificacoes,
} from "../../actions/notificacoes-actions";

describe("useNotificacoesRealtime", () => {
  const mockUser = { id: "auth-user-123" };
  const mockSession = { access_token: "session-token" };
  const mockUsuario = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup padrão - usuário autenticado
    mockAuthGetUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockAuthGetSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockRealtimeSetAuth.mockResolvedValue(undefined);

    (actionListarNotificacoes as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          notificacoes: [],
        },
      },
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockUsuario,
        error: null,
      }),
    });

    // Reset channel mocks
    mockGetChannels.mockReturnValue([]);
    mockSubscribe.mockImplementation((callback) => {
      // Simular subscription bem-sucedida por padrão
      callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED, null);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Subscription States", () => {
    it("deve configurar canal Realtime com sucesso quando SUBSCRIBED", async () => {
      const onNovaNotificacao = jest.fn();

      renderHook(() =>
        useNotificacoesRealtime({
          usuarioId: 1,
          sessionToken: "session-token",
          onNovaNotificacao,
        })
      );

      await waitFor(() => {
        expect(mockRealtimeSetAuth).toHaveBeenCalledWith("session-token");
        expect(mockChannel).toHaveBeenCalledWith("notifications:1");
      });

      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: "usuario_id=eq.1",
        }),
        expect.any(Function)
      );
    });

    it("deve ativar retry com backoff em CHANNEL_ERROR", async () => {
      let subscribeCallCount = 0;

      mockSubscribe.mockImplementation((callback) => {
        subscribeCallCount++;
        // Simular erro nas primeiras 2 tentativas
        if (subscribeCallCount <= 2) {
          callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Connection failed"));
        } else {
          callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED, null);
        }
      });

      renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar timer para primeira retry (1000ms base delay)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
      });

      // Avançar timer para segunda retry (2000ms = 2^1 * 1000)
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(3);
      });
    });

    it("deve ativar retry em TIMED_OUT", async () => {
      mockSubscribe.mockImplementationOnce((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT, null);
      });

      renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar timer para retry
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledTimes(2);
      });
    });

    it("deve ativar polling após máximo de retries", async () => {
      mockSubscribe.mockImplementation((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Connection failed"));
      });

      (actionContarNotificacoesNaoLidas as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          success: true,
          data: {
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
          },
        },
      });

      const { result } = renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Avançar todos os delays de retry (1s + 2s + 4s + 8s + 16s)
      await act(async () => {
        jest.advanceTimersByTime(1000); // Retry 1
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
      });

      await act(async () => {
        jest.advanceTimersByTime(2000); // Retry 2
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(3);
      });

      await act(async () => {
        jest.advanceTimersByTime(4000); // Retry 3 (último)
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(4);
      });

      await act(async () => {
        jest.advanceTimersByTime(8000); // Retry 4
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(5);
      });

      await act(async () => {
        jest.advanceTimersByTime(16000); // Retry 5
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(6);
      });

      // Após o limite de retries, polling deve ser ativado
      await waitFor(() => {
        expect(result.current.isUsingPolling).toBe(true);
      });
    });
  });

  describe("Channel Cleanup", () => {
    it("deve remover canal no cleanup", async () => {
      const { unmount } = renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });

    it("deve remover canal existente não inscrito antes de recriar", async () => {
      const existingChannel = {
        topic: "notifications:1",
        state: REALTIME_SUBSCRIBE_STATES.CLOSED,
        params: { config: { private: true } },
      };

      mockGetChannels.mockReturnValue([existingChannel]);

      renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
      });

      expect(mockChannel).toHaveBeenCalledWith("notifications:1");
    });

    it("deve remover canal existente mesmo se já inscrito (evitar duplicatas)", async () => {
      const existingChannel = {
        topic: "notifications:1",
        state: REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
        params: { config: { private: true } },
      };

      mockGetChannels.mockReturnValue([existingChannel]);

      renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockGetChannels).toHaveBeenCalled();
      });

      expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
      expect(mockChannel).toHaveBeenCalledWith("notifications:1");
    });
  });

  describe("Callbacks", () => {
    it("deve chamar onNovaNotificacao quando receber payload de INSERT", async () => {
      const onNovaNotificacao = jest.fn();
      let postgresChangesHandler: ((payload: { new: unknown }) => void) | null = null;

      mockOn.mockImplementation((event, options, handler) => {
        if (event === "postgres_changes" && options.event === "INSERT") {
          postgresChangesHandler = handler;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() =>
        useNotificacoesRealtime({
          usuarioId: 1,
          sessionToken: "session-token",
          onNovaNotificacao,
        })
      );

      await waitFor(() => {
        expect(postgresChangesHandler).not.toBeNull();
      });

      // Simular nova notificação
      const mockPayload = {
        new: {
          id: 1,
          usuario_id: 1,
          tipo: "processo_atribuido",
          titulo: "Novo processo",
          descricao: "Você foi atribuído ao processo 123",
          entidade_tipo: "processo",
          entidade_id: 123,
          lida: false,
          lida_em: null,
          dados_adicionais: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      await act(async () => {
        postgresChangesHandler!(mockPayload);
      });

      expect(onNovaNotificacao).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          tipo: "processo_atribuido",
          titulo: "Novo processo",
        })
      );
    });

    it("deve chamar onContadorChange durante polling", async () => {
      const onContadorChange = jest.fn();
      let subscribeCallCount = 0;

      // Forçar modo polling após 3 falhas
      mockSubscribe.mockImplementation((callback) => {
        subscribeCallCount++;
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Forced error"));
      });

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

      (actionContarNotificacoesNaoLidas as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          success: true,
          data: mockContador,
        },
      });

      const { result } = renderHook(() =>
        useNotificacoesRealtime({
          usuarioId: 1,
          sessionToken: "session-token",
          onContadorChange,
        })
      );

      // Aguardar primeira tentativa
      await waitFor(() => {
        expect(subscribeCallCount).toBe(1);
      });

      // Avançar para retry 1 (1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(subscribeCallCount).toBe(2);
      });

      // Avançar para retry 2 (2000ms)
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(subscribeCallCount).toBe(3);
      });

      // Avançar para retry 3 (4000ms)
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(subscribeCallCount).toBe(4);
      });

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(subscribeCallCount).toBe(5);
      });

      await act(async () => {
        jest.advanceTimersByTime(16000);
      });

      await waitFor(() => {
        expect(subscribeCallCount).toBe(6);
      });

      // Aguardar polling ser ativado
      await waitFor(() => {
        expect(result.current.isUsingPolling).toBe(true);
      });

      // Aguardar polling executar e chamar callback
      await waitFor(() => {
        expect(actionContarNotificacoesNaoLidas).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onContadorChange).toHaveBeenCalledWith(mockContador);
      });
    });
  });

  describe("Edge Cases", () => {
    it("não deve configurar Realtime sem usuarioId", async () => {
      renderHook(() => useNotificacoesRealtime({ sessionToken: "session-token" }));

      // Não deve criar canal
      expect(mockChannel).not.toHaveBeenCalled();
      expect(mockRealtimeSetAuth).not.toHaveBeenCalled();
    });

    it("deve ativar polling quando sessionToken estiver ausente", async () => {
      const { result } = renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: null })
      );

      await waitFor(() => {
        expect(result.current.isUsingPolling).toBe(true);
      });

      // Sem token não deve tentar abrir o canal Realtime
      expect(mockChannel).not.toHaveBeenCalled();
      expect(mockRealtimeSetAuth).not.toHaveBeenCalled();
    });

    it("deve limpar timeout de retry no unmount", async () => {
      mockSubscribe.mockImplementation((callback) => {
        callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("Error"));
      });

      const { unmount } = renderHook(() =>
        useNotificacoesRealtime({ usuarioId: 1, sessionToken: "session-token" })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      // Unmount antes do retry completar
      unmount();

      // Avançar timer - retry não deve executar após unmount
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Channel foi criado apenas uma vez (antes do unmount)
      expect(mockChannel).toHaveBeenCalledTimes(1);
    });
  });
});
