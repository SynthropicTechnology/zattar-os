"use client";

/**
 * Hook para gerenciar notificações do usuário
 * Inclui suporte a Realtime para atualizações em tempo real
 *
 * @see RULES.md para documentação de troubleshooting do Realtime
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  checkVersionMismatch,
  isServerActionVersionError,
  handleVersionMismatchError,
} from "@/lib/version";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import type {
  Notificacao,
  ContadorNotificacoes,
  ListarNotificacoesParams,
  TipoNotificacaoUsuario,
  EntidadeTipo,
} from "../domain";
import {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "../actions/notificacoes-actions";
import { useDeepCompareMemo } from "@/hooks/use-render-count";

// Configurações do Realtime
const REALTIME_CONFIG = {
  MAX_RETRIES: 5, // Aumentado para dar mais chances de reconexão
  BASE_DELAY_MS: 1000,
  POLLING_INTERVAL_MS: 60000, // 60s para polling fallback
  RECONNECT_DELAY_MS: 2000, // Delay antes de tentar reconectar
} as const;

/**
 * Extrai informações úteis de um erro do Realtime
 * O erro pode ser um Error, CloseEvent, ou objeto genérico
 */
function extractRealtimeErrorInfo(err: unknown): {
  message: string;
  code?: number | string;
  reason?: string;
  type?: string;
} {
  if (!err) {
    return { message: "Erro desconhecido (null/undefined)" };
  }

  // Error padrão
  if (err instanceof Error) {
    return {
      message: err.message,
      type: err.name,
    };
  }

  // CloseEvent do WebSocket
  if (typeof err === "object" && "code" in err && "reason" in err) {
    const closeEvent = err as { code: number; reason: string; wasClean?: boolean };
    return {
      message: closeEvent.reason || `WebSocket fechado com código ${closeEvent.code}`,
      code: closeEvent.code,
      reason: closeEvent.reason,
      type: "CloseEvent",
    };
  }

  // Objeto genérico com message
  if (typeof err === "object" && "message" in err) {
    return {
      message: String((err as { message: unknown }).message),
      type: "object",
    };
  }

  // String
  if (typeof err === "string") {
    return { message: err, type: "string" };
  }

  // Fallback - tentar converter para string
  try {
    return { message: JSON.stringify(err), type: typeof err };
  } catch {
    return { message: String(err), type: typeof err };
  }
}

export function useNotificacoes(params?: ListarNotificacoesParams) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [contador, setContador] = useState<ContadorNotificacoes>({
    total: 0,
    por_tipo: {
      processo_atribuido: 0,
      processo_movimentacao: 0,
      audiencia_atribuida: 0,
      audiencia_alterada: 0,
      expediente_atribuido: 0,
      expediente_alterado: 0,
      prazo_vencendo: 0,
      prazo_vencido: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Estabilizar params com comparação profunda
  // Evita re-fetches quando params tem mesmos valores mas referência diferente
  const stableParams = useDeepCompareMemo(
    () => params || { pagina: 1, limite: 20 },
    [params]
  );

  // Buscar notificações
  const buscarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await actionListarNotificacoes(stableParams);

      if (result.success && result.data?.success) {
        setNotificacoes(result.data.data.notificacoes);
      } else {
        setError(
          result.success === false
            ? result.error || "Erro ao buscar notificações"
            : result.data?.success === false
              ? result.data.error.message
              : "Erro ao buscar notificações"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  // Buscar contador
  const buscarContador = useCallback(async () => {
    try {
      const result = await actionContarNotificacoesNaoLidas({});

      if (result.success && result.data?.success) {
        setContador(result.data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar contador de notificações:", err);
    }
  }, []);

  // Marcar como lida
  const marcarComoLida = useCallback(
    async (id: number) => {
      try {
        const result = await actionMarcarNotificacaoComoLida({ id });

        if (result.success) {
          // Atualizar estado local
          setNotificacoes((prev) =>
            prev.map((n) =>
              n.id === id
                ? { ...n, lida: true, lida_em: new Date().toISOString() }
                : n
            )
          );
          // Atualizar contador
          await buscarContador();
        }
      } catch (err) {
        console.error("Erro ao marcar notificação como lida:", err);
      }
    },
    [buscarContador]
  );

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      const result = await actionMarcarTodasComoLidas({});

      if (result.success) {
        // Atualizar estado local
        setNotificacoes((prev) =>
          prev.map((n) => ({
            ...n,
            lida: true,
            lida_em: new Date().toISOString(),
          }))
        );
        // Atualizar contador
        await buscarContador();
      }
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, [buscarContador]);

  // Carregar dados iniciais
  useEffect(() => {
    // Executar na primeira render
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }

    buscarNotificacoes();
    buscarContador();
  }, [buscarNotificacoes, buscarContador]);

  return {
    notificacoes,
    contador,
    loading,
    error,
    refetch: buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}

/**
 * Hook para escutar notificações em tempo real via Supabase Realtime
 *
 * IMPORTANTE: Para evitar re-subscriptions, o callback onNovaNotificacao
 * é armazenado em uma ref. Isso significa que mudanças no callback não causam
 * re-criação da subscription.
 *
 * Funcionalidades:
 * - Retry automático com backoff exponencial em caso de falha
 * - Fallback para polling quando Realtime não está disponível
 * - Logging estruturado para debugging
 *
 * @see RULES.md para documentação de troubleshooting
 */
export function useNotificacoesRealtime(options?: {
  usuarioId?: number;
  sessionToken?: string | null;
  onNovaNotificacao?: (notificacao: Notificacao) => void;
  onContadorChange?: (contador: ContadorNotificacoes) => void;
}) {
  const { usuarioId: _usuarioId, sessionToken, onNovaNotificacao, onContadorChange } = options || {};
  const usuarioId = _usuarioId;

  // Usar singleton client para evitar múltiplas conexões Realtime
  const supabase = getSupabaseBrowserClient();

  // Estado para controlar fallback de polling
  const [usePolling, setUsePolling] = useState(false);

  // Usar ref para callback evitar re-subscriptions quando callback muda
  const callbackRef = useRef(onNovaNotificacao);
  const contadorCallbackRef = useRef(onContadorChange);

  // Refs para controle de retry e canal
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectingRef = useRef(false);

  // Ref para rastrear último contador (detectar mudanças no polling)
  const lastContadorRef = useRef<ContadorNotificacoes | null>(null);

  // Manter refs atualizadas
  useEffect(() => {
    callbackRef.current = onNovaNotificacao;
  }, [onNovaNotificacao]);

  useEffect(() => {
    contadorCallbackRef.current = onContadorChange;
  }, [onContadorChange]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Limpa o canal atual de forma segura
     */
    const cleanupChannel = async () => {
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current);
        } catch {
          // Ignorar erros de cleanup
        }
        channelRef.current = null;
      }
    };

    /**
     * Remove canais duplicados/órfãos que podem estar causando conflitos
     */
    const cleanupOrphanChannels = (channelName: string) => {
      const existingChannels = supabase.getChannels().filter((ch) => {
        // Match canais com o mesmo nome ou que terminam com o nome
        return ch.topic === channelName ||
          ch.topic.endsWith(`:${channelName}`) ||
          ch.topic.includes(`notifications:`);
      });

      if (existingChannels.length > 0) {
        /* console.log(
          "🧹 [Notificações Realtime] Limpando canais órfãos:",
          existingChannels.map((ch) => ch.topic)
        ); */
        existingChannels.forEach((ch) => {
          try {
            supabase.removeChannel(ch);
          } catch {
            // Ignorar erros de cleanup
          }
        });
      }
    };

    // Manter o token do Realtime sempre atualizado (especialmente após refresh)
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) return;
      try {
        await supabase.realtime.setAuth(session.access_token);
      } catch {
        // Não derrubar a UI por falha no setAuth; setupRealtime já tem fallback.
      }
    });

    const setupRealtime = async () => {
      // Evitar múltiplas tentativas de conexão simultâneas
      if (isConnectingRef.current) {
        console.log("🔄 [Notificações Realtime] Conexão já em andamento, aguardando...");
        return;
      }

      isConnectingRef.current = true;

      try {
        // Aguardar dados do usuário (UserProvider pode não ter carregado ainda)
        if (!usuarioId) {
          isConnectingRef.current = false;
          return;
        }

        if (!isMounted) {
          isConnectingRef.current = false;
          return;
        }

        if (!sessionToken) {
          setUsePolling(true);
          isConnectingRef.current = false;
          return;
        }

        // Configurar autenticação do Realtime
        try {
          await supabase.realtime.setAuth(sessionToken);
        } catch (authError) {
          const errorInfo = extractRealtimeErrorInfo(authError);
          console.error(
            "❌ [Notificações Realtime] Falha ao configurar autenticação:",
            errorInfo
          );
          setUsePolling(true);
          isConnectingRef.current = false;
          return;
        }

        const channelName = `notifications:${usuarioId}`;

        // Limpar canal atual e canais órfãos antes de criar novo
        await cleanupChannel();
        cleanupOrphanChannels(channelName);

        if (!isMounted) {
          isConnectingRef.current = false;
          return;
        }

        // Log para debug
        /* console.log("🔄 [Notificações Realtime] Configurando canal:", {
          usuarioId,
          authUserId: user.id,
          channelName,
          tentativa: retryCountRef.current + 1,
        }); */

        // Criar novo canal
        // Para `postgres_changes`, canal público + RLS na tabela é suficiente e mais estável
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // Usar postgres_changes para escutar INSERT na tabela notificacoes
        // filtrado pelo usuario_id do usuário atual
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificacoes",
            filter: `usuario_id=eq.${usuarioId}`,
          },
          (payload) => {
            if (callbackRef.current && payload.new) {
              const newRecord = payload.new as {
                id: number;
                usuario_id: number;
                tipo: string;
                titulo: string;
                descricao: string;
                entidade_tipo: string;
                entidade_id: number;
                lida: boolean;
                lida_em: string | null;
                dados_adicionais: Record<string, unknown>;
                created_at: string;
                updated_at: string;
              };

              /* console.log(
                "📩 [Notificações Realtime] Nova notificação recebida:",
                { id: newRecord.id, tipo: newRecord.tipo }
              ); */

              callbackRef.current({
                id: newRecord.id,
                usuario_id: newRecord.usuario_id,
                tipo: newRecord.tipo as TipoNotificacaoUsuario,
                titulo: newRecord.titulo,
                descricao: newRecord.descricao,
                entidade_tipo: newRecord.entidade_tipo as EntidadeTipo,
                entidade_id: newRecord.entidade_id,
                lida: newRecord.lida,
                lida_em: newRecord.lida_em,
                dados_adicionais: newRecord.dados_adicionais,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at,
              });
            }
          }
        );

        // Subscrever ao canal com tratamento de status
        channel.subscribe((status) => {
          isConnectingRef.current = false;

          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            /* console.log(
              `✅ [Notificações Realtime] Inscrito com sucesso em ${duration}ms`
            ); */
            // Reset retry count on success
            retryCountRef.current = 0;
            setUsePolling(false);
          } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
            // Tentar reconectar com backoff exponencial
            scheduleRetry(isMounted);
          } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
            scheduleRetry(isMounted);
          } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
            // CLOSED é disparado quando NÓS removemos o canal (cleanup).
            // Não devemos tentar reconectar aqui — isso criava um loop infinito:
            // cleanup → removeChannel → CLOSED → scheduleRetry → cleanup → ...
            // Retries já são tratados em CHANNEL_ERROR e TIMED_OUT.
          }
        });
      } catch {
        isConnectingRef.current = false;
        scheduleRetry(isMounted);
      }
    };

    /**
     * Agenda uma nova tentativa de conexão com backoff exponencial
     */
    const scheduleRetry = (mounted: boolean) => {
      if (!mounted) return;

      if (retryCountRef.current < REALTIME_CONFIG.MAX_RETRIES) {
        const delay =
          Math.pow(2, retryCountRef.current) * REALTIME_CONFIG.BASE_DELAY_MS;

        /* console.log(
          `🔄 [Notificações Realtime] Reconectando em ${delay}ms (tentativa ${retryCountRef.current + 1}/${REALTIME_CONFIG.MAX_RETRIES})`
        ); */

        // Limpar timeout anterior se existir
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = setTimeout(async () => {
          if (mounted) {
            retryCountRef.current++;
            await cleanupChannel();
            setupRealtime();
          }
        }, delay);
      } else {
        console.warn(
          "⚠️ [Notificações Realtime] Máximo de tentativas atingido. Ativando polling."
        );
        setUsePolling(true);
      }
    };

    // Iniciar conexão com pequeno delay para evitar race conditions
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        setupRealtime();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      authSubscription?.unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      // Cleanup assíncrono do canal
      cleanupChannel();
    };
  }, [supabase, usuarioId, sessionToken]);

  // Fallback para polling quando Realtime não está disponível
  useEffect(() => {
    if (!usePolling) return;

    /* console.log(
      `📊 [Notificações Polling] Ativado - intervalo: ${REALTIME_CONFIG.POLLING_INTERVAL_MS}ms`
    ); */

    const pollNotificacoes = async () => {
      // Verificar se houve mudança de versão do build antes de chamar action
      // Isso previne erros de "Failed to find Server Action" após deploys
      if (checkVersionMismatch()) {
        console.log(
          "🔄 [Notificações Polling] Versão do app mudou - recarregando..."
        );
        await handleVersionMismatchError();
        return;
      }

      try {
        // Usar a action para buscar contador de notificações
        const result = await actionContarNotificacoesNaoLidas({});
        if (result.success && result.data?.success) {
          const novoContador = result.data.data;

          // Verificar se houve mudança no contador
          const contadorMudou =
            !lastContadorRef.current ||
            lastContadorRef.current.total !== novoContador.total;

          /* console.log("📊 [Notificações Polling] Verificação concluída", {
            total: novoContador.total,
            anterior: lastContadorRef.current?.total ?? "N/A",
            mudou: contadorMudou,
          }); */

          // Atualizar ref do último contador
          lastContadorRef.current = novoContador;

          // Notificar callback sobre mudança no contador
          if (contadorCallbackRef.current) {
            contadorCallbackRef.current(novoContador);
          }

          // Se o total aumentou, notificar que há novas notificações
          // Otimização: não buscar notificações completas aqui para reduzir Disk I/O
          // Deixar a UI fazer a fetch sob demanda quando necessário
          if (contadorMudou && novoContador.total > 0) {
            console.log(
              "📊 [Notificações Polling] Contador mudou - notificações em cache aguardando"
            );
            // Polling detectou mudança; UI pode fazer actionListarNotificacoes() quando quiser
            // Removido: fetch automático de actionListarNotificacoes para reduzir I/O
          }
        }
      } catch (error) {
        // Verificar se é erro de Server Action não encontrada (após deploy)
        if (isServerActionVersionError(error)) {
          console.log(
            "🔄 [Notificações Polling] Server Action não encontrada - recarregando..."
          );
          await handleVersionMismatchError();
          return;
        }
        console.error("❌ [Notificações Polling] Erro ao verificar:", error);
      }
    };

    // Executar imediatamente
    pollNotificacoes();

    // Configurar intervalo
    const interval = setInterval(
      pollNotificacoes,
      REALTIME_CONFIG.POLLING_INTERVAL_MS
    );

    return () => {
      // console.log("📊 [Notificações Polling] Desativado");
      clearInterval(interval);
    };
  }, [usePolling, sessionToken]);

  return { isUsingPolling: usePolling };
}

