'use client';

/**
 * CHAT FEATURE - useChatSubscription Hook
 *
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 * Usa Postgres Changes (INSERT events) para sincronização automática.
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresInsertPayload, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import type { MensagemComUsuario, MensagemChatRow, UsuarioChat } from '../domain';

type BroadcastNewMessagePayload = {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: MensagemComUsuario['tipo'];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status?: string | null;
  data?: unknown;
  // Dados de usuário incluídos no broadcast para evitar lookup
  usuarioNome?: string;
  usuarioAvatar?: string;
};

/** Função para buscar dados de usuário por ID */
export type UserLookupFn = (userId: number) => UsuarioChat | undefined;

interface UseChatSubscriptionProps {
  /** ID da sala de chat */
  salaId: number;
  /** Callback chamado quando uma nova mensagem chega */
  onNewMessage: (mensagem: MensagemComUsuario) => void;
  /** Se false, não cria subscription (útil para SSR) */
  enabled?: boolean;
  /** ID do usuário atual (para marcar ownMessage) */
  currentUserId: number;
  /** Função para buscar dados de usuário (para preencher nome/avatar em msgs realtime) */
  getUserById?: UserLookupFn;
}

interface UseChatSubscriptionReturn {
  /** Indica se o canal está conectado */
  isConnected: boolean;

  /** Envia broadcast com nova mensagem (fallback quando Postgres Changes falha) */
  broadcastNewMessage: (payload: BroadcastNewMessagePayload) => Promise<void>;
}

/**
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 */
export function useChatSubscription({
  salaId,
  onNewMessage,
  enabled = true,
  currentUserId,
  getUserById,
}: UseChatSubscriptionProps): UseChatSubscriptionReturn {
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Usar ref para armazenar o callback mais recente sem causar re-subscription
  const onNewMessageRef = useRef(onNewMessage);
  const currentUserIdRef = useRef(currentUserId);
  const getUserByIdRef = useRef(getUserById);

  // Atualizar refs quando props mudam
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    getUserByIdRef.current = getUserById;
  }, [getUserById]);

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    // Helper para obter dados do usuário
    const getUsuarioData = (usuarioId: number, fallbackNome?: string, fallbackAvatar?: string): UsuarioChat => {
      const cachedUser = getUserByIdRef.current?.(usuarioId);
      if (cachedUser) {
        return cachedUser;
      }
      // Fallback com dados do broadcast ou valores padrão
      return {
        id: usuarioId,
        nomeCompleto: fallbackNome || `Usuário ${usuarioId}`,
        nomeExibicao: fallbackNome || null,
        emailCorporativo: null,
        avatar: fallbackAvatar,
      };
    };

    // Handler que usa refs para evitar dependências instáveis
    // Otimização: constrói MensagemComUsuario diretamente do payload Realtime
    // para evitar query adicional por INSERT
    const handleInsert = async (
      payload: RealtimePostgresInsertPayload<MensagemChatRow>
    ) => {
      const msgRow = payload.new;

      // Extrair dados de usuário do payload se disponível (de Realtime)
      // Caso contrário, usar valores padrão (será preenchido quando necessário)
      const usuarioId = msgRow.usuario_id;

      // Buscar dados do usuário do cache local
      const usuario = getUsuarioData(usuarioId);

      // Construir mensagem diretamente do payload sem query adicional
      const mensagem: MensagemComUsuario = {
        id: msgRow.id,
        salaId: msgRow.sala_id,
        usuarioId: usuarioId,
        conteudo: msgRow.conteudo,
        tipo: msgRow.tipo as MensagemComUsuario['tipo'],
        createdAt: msgRow.created_at,
        updatedAt: msgRow.updated_at,
        deletedAt: msgRow.deleted_at,
        status: msgRow.status || 'sent',
        data: msgRow.data ?? undefined,
        ownMessage: usuarioId === currentUserIdRef.current,
        usuario,
      };

      onNewMessageRef.current(mensagem);
    };

    const handleBroadcast = ({ payload }: { payload: unknown }) => {
      if (!payload || typeof payload !== 'object') return;

      const maybe = payload as Partial<BroadcastNewMessagePayload>;
      if (
        typeof maybe.id !== 'number' ||
        typeof maybe.salaId !== 'number' ||
        typeof maybe.usuarioId !== 'number' ||
        typeof maybe.conteudo !== 'string' ||
        typeof maybe.tipo !== 'string' ||
        typeof maybe.createdAt !== 'string' ||
        typeof maybe.updatedAt !== 'string'
      ) {
        return;
      }

      // Buscar dados do usuário do cache local ou usar dados do broadcast
      const usuario = getUsuarioData(maybe.usuarioId, maybe.usuarioNome, maybe.usuarioAvatar);

      const mensagem: MensagemComUsuario = {
        id: maybe.id,
        salaId: maybe.salaId,
        usuarioId: maybe.usuarioId,
        conteudo: maybe.conteudo,
        tipo: maybe.tipo as MensagemComUsuario['tipo'],
        createdAt: maybe.createdAt,
        updatedAt: maybe.updatedAt,
        deletedAt: maybe.deletedAt ?? null,
        status: (maybe.status as MensagemComUsuario['status']) ?? 'sent',
        data: maybe.data as MensagemComUsuario['data'],
        ownMessage: maybe.usuarioId === currentUserIdRef.current,
        usuario,
      };

      onNewMessageRef.current(mensagem);
    };

    const setupSubscription = async () => {
      // Verificar autenticação antes de subscrever
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError) {
        console.error(`[Chat] Erro ao verificar sessão:`, sessionError.message);
        setIsConnected(false);
        return;
      }

      if (!session) {
        console.warn(`[Chat] Usuário não autenticado - subscription não será criada para sala ${salaId}`);
        setIsConnected(false);
        return;
      }

      console.log(`[Chat] Sessão válida, criando subscription para sala ${salaId}`);

      // Criar canal específico para a sala
      channel = supabase.channel(`sala_${salaId}_messages`);
      channelRef.current = channel;

      // Subscrever a INSERT events na tabela mensagens_chat
      channel
        .on('broadcast', { event: 'new-message' }, handleBroadcast)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens_chat',
            filter: `sala_id=eq.${salaId}`,
          },
          handleInsert
        )
        .subscribe((status: REALTIME_SUBSCRIBE_STATES, err?: Error) => {
          if (cancelled) return;

          if (status === 'SUBSCRIBED') {
            console.log(`[Chat] Subscrito à sala ${salaId}`);
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Chat] Erro ao subscrever à sala ${salaId}:`, err?.message || 'Erro desconhecido');
            console.error(`[Chat] Possíveis causas: RLS bloqueando, tabela não está em supabase_realtime publication, ou Realtime não habilitado`);
            setIsConnected(false);
          } else if (status === 'TIMED_OUT') {
            console.warn(`[Chat] Timeout ao subscrever à sala ${salaId}`);
            setIsConnected(false);
          } else if (status === 'CLOSED') {
            console.log(`[Chat] Canal fechado para sala ${salaId}`);
            setIsConnected(false);
          }
        });
    };

    setupSubscription();

    // Cleanup: remover canal ao desmontar
    return () => {
      cancelled = true;
      console.log(`[Chat] Desconectando da sala ${salaId}`);
      if (channel) {
        supabase.removeChannel(channel);
      }
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [salaId, enabled, supabase]);

  const broadcastNewMessage = async (payload: BroadcastNewMessagePayload) => {
    const channel = channelRef.current;
    if (!channel) return;

    await channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload,
    });
  };

  return {
    isConnected,
    broadcastNewMessage,
  };
}