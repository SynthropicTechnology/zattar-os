'use client';

/**
 * CHAT FEATURE - useChatPresence Hook
 *
 * Hook para gerenciar a presença do usuário no chat.
 * Usa Supabase Realtime Presence para rastrear usuários online.
 * Também atualiza o status no banco de dados para persistência.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatPresenceProps {
  /** ID do usuário atual */
  userId: number;
  /** Se false, não ativa a presença */
  enabled?: boolean;
}

interface PresenceUser {
  id: number;
  onlineStatus: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

interface UseChatPresenceReturn {
  /** Mapa de usuários online */
  onlineUsers: Map<number, PresenceUser>;
  /** Verificar se um usuário está online */
  isUserOnline: (userId: number) => boolean;
  /** Status do usuário */
  getUserStatus: (userId: number) => 'online' | 'away' | 'offline';
}

const PRESENCE_CHANNEL = 'chat_presence';
const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutos para status "away"

/**
 * Hook para gerenciar presença do usuário no chat
 */
export function useChatPresence({
  userId,
  enabled = true,
}: UseChatPresenceProps): UseChatPresenceReturn {
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<number, PresenceUser>>(new Map());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStatusRef = useRef<'online' | 'away'>('online');

  // Atualizar status no banco de dados
  const updateDatabaseStatus = useCallback(async (status: 'online' | 'away' | 'offline') => {
    try {
      // Buscar o auth_user_id primeiro
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('[ChatPresence] Sem sessão ativa');
        return;
      }

      // Atualizar usando auth_user_id ao invés de id
      const { error } = await supabase
        .from('usuarios')
        .update({ online_status: status })
        .eq('auth_user_id', session.user.id);

      if (error) {
        console.error('[ChatPresence] Erro ao atualizar status:', error);
      }
    } catch (error) {
      console.error('[ChatPresence] Erro ao atualizar status:', error);
    }
  }, [supabase]);

  // Resetar timeout de inatividade
  const resetActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Se estava away, voltar para online
    if (currentStatusRef.current === 'away') {
      currentStatusRef.current = 'online';
      channelRef.current?.track({ userId, status: 'online' });
      updateDatabaseStatus('online');
    }

    // Configurar timeout para away
    activityTimeoutRef.current = setTimeout(() => {
      currentStatusRef.current = 'away';
      channelRef.current?.track({ userId, status: 'away' });
      updateDatabaseStatus('away');
    }, AWAY_TIMEOUT);
  }, [userId, updateDatabaseStatus]);

  // Monitorar atividade do usuário
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => resetActivityTimeout();

    // Eventos de atividade
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Iniciar timeout
    resetActivityTimeout();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [enabled, resetActivityTimeout]);

  // Gerenciar canal de presença
  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase.channel(PRESENCE_CHANNEL);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: number; status: 'online' | 'away' }>();
        const newOnlineUsers = new Map<number, PresenceUser>();

        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            newOnlineUsers.set(presence.userId, {
              id: presence.userId,
              onlineStatus: presence.status,
              lastSeen: new Date().toISOString(),
            });
          });
        });

        setOnlineUsers(newOnlineUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Registrar presença
          await channel.track({ userId, status: 'online' });
          await updateDatabaseStatus('online');
          console.log('[ChatPresence] Usuário conectado:', userId);
        }
      });

    // Cleanup ao sair
    const handleBeforeUnload = () => {
      updateDatabaseStatus('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('[ChatPresence] Desconectando usuário:', userId);
      updateDatabaseStatus('offline');
      supabase.removeChannel(channel);
      channelRef.current = null;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, enabled, supabase, updateDatabaseStatus]);

  // Verificar se usuário está online
  const isUserOnline = useCallback((id: number): boolean => {
    return onlineUsers.has(id);
  }, [onlineUsers]);

  // Obter status do usuário
  const getUserStatus = useCallback((id: number): 'online' | 'away' | 'offline' => {
    const user = onlineUsers.get(id);
    return user?.onlineStatus || 'offline';
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    getUserStatus,
  };
}
