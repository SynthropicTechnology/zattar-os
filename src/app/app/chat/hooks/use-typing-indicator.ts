'use client';

/**
 * CHAT FEATURE - useTypingIndicator Hook
 *
 * Hook para gerenciar indicador de digitação em tempo real.
 * Usa Supabase Broadcast para comunicação em tempo real entre usuários.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { TypingUser } from '../domain';

/** Tempo em ms para considerar que o usuário parou de digitar */
const TYPING_TIMEOUT = 3000;

interface UseTypingIndicatorReturn {
  /** Mapa de usuários que estão digitando */
  typingUsers: Map<number, TypingUser>;
  /** Texto formatado do indicador (ex: "João está digitando...") */
  typingIndicatorText: string | null;
  /** Função para indicar que o usuário começou a digitar */
  startTyping: () => void;
  /** Função para indicar que o usuário parou de digitar */
  stopTyping: () => void;
}

/**
 * Hook para gerenciar indicador de digitação em tempo real.
 *
 * Usa Supabase Broadcast para comunicação entre usuários da mesma sala.
 * Automaticamente remove indicadores expirados após TYPING_TIMEOUT.
 *
 * @param salaId - ID da sala de chat
 * @param currentUserId - ID do usuário atual
 * @param currentUserName - Nome do usuário atual para exibição
 *
 * @example
 * ```tsx
 * const { typingIndicatorText, startTyping, stopTyping } = useTypingIndicator(
 *   salaId,
 *   currentUserId,
 *   currentUserName
 * );
 *
 * // No input
 * <Input onChange={(e) => { setValue(e.target.value); startTyping(); }} />
 *
 * // Na UI
 * {typingIndicatorText && <span>{typingIndicatorText}</span>}
 * ```
 */
export function useTypingIndicator(
  salaId: number,
  currentUserId: number,
  currentUserName: string
): UseTypingIndicatorReturn {
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Broadcast typing state
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel) return;

      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          isTyping,
        },
      });
    },
    [currentUserId, currentUserName]
  );

  // Start typing
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        broadcastTyping(false);
      }
    }, TYPING_TIMEOUT);
  }, [broadcastTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      broadcastTyping(false);
    }
  }, [broadcastTyping]);

  // Setup channel
  useEffect(() => {
    const channel = supabase.channel(`sala_${salaId}_typing`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, userName, isTyping } = payload as {
          userId: number;
          userName: string;
          isTyping: boolean;
        };

        if (userId === currentUserId) return;

        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(userId, { userId, userName, timestamp: Date.now() });
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      })
      .subscribe();

    // Cleanup expired typing indicators
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const newMap = new Map(prev);
        let changed = false;

        for (const [userId, user] of newMap) {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            newMap.delete(userId);
            changed = true;
          }
        }

        return changed ? newMap : prev;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
      channelRef.current = null;
    };
  }, [salaId, currentUserId, supabase]);

  // Build indicator text
  const typingIndicatorText = (() => {
    const names = Array.from(typingUsers.values()).map((u) => u.userName);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} está digitando...`;
    if (names.length === 2) return `${names[0]} e ${names[1]} estão digitando...`;
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]} estão digitando...`;
  })();

  return {
    typingUsers,
    typingIndicatorText,
    startTyping,
    stopTyping,
  };
}
