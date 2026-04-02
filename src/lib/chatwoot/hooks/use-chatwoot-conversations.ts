/**
 * Hook para gerenciar conversas Chatwoot
 * 
 * Fornece funcionalidades para buscar, sincronizar e monitorar conversas
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { err, appError } from '../../../types';
import type { ConversaChatwoot } from '../domain';
import { sincronizarConversaManual } from '../actions';

// =============================================================================
// Types
// =============================================================================

export interface UseChatwootConversationsOptions {
  /** Account ID do Chatwoot */
  accountId?: number;
  /** Auto-sincronizar ao montar (padrão: false) */
  autoSync?: boolean;
  /** Intervalo de auto-sincronização em ms (padrão: 30s) */
  syncInterval?: number;
  /** Filtro por status (padrão: todos) */
  status?: 'open' | 'resolved' | 'pending' | 'snoozed';
}

export interface UseChatwootConversationsState {
  conversations: ConversaChatwoot[];
  loading: boolean;
  error: Error | null;
  lastSync: Date | null;
  isSyncing: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook para gerenciar conversas Chatwoot
 * 
 * @example
 * ```tsx
 * const { conversations, loading, sync } = useChatwootConversations({
 *   accountId: 1,
 *   autoSync: true,
 *   syncInterval: 30000
 * });
 * ```
 */
export function useChatwootConversations(
  options: UseChatwootConversationsOptions = {}
) {
  const {
    accountId,
    autoSync = false,
    syncInterval = 30000,
    status,
  } = options;

  const [state, setState] = useState<UseChatwootConversationsState>({
    conversations: [],
    loading: false,
    error: null,
    lastSync: null,
    isSyncing: false,
  });

  // Sincronizar conversa específica
  const syncConversation = useCallback(
    async (conversationId: number) => {
      if (!accountId) {
        const error = new Error('Account ID é obrigatório');
        setState((prev) => ({
          ...prev,
          error,
        }));
        return err(appError('VALIDATION_ERROR', 'Account ID é obrigatório'));
      }

      setState((prev) => ({ ...prev, isSyncing: true }));

      try {
        const result = await sincronizarConversaManual(
          conversationId,
          accountId
        );

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            error: new Error(result.error.message),
            isSyncing: false,
          }));
          return result;
        }

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date(),
        }));

        return result;
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          error: errorObj,
          isSyncing: false,
        }));
        const cause = error instanceof Error ? error : undefined;
        return err(
          appError('EXTERNAL_SERVICE_ERROR', errorObj.message, undefined, cause)
        );
      }
    },
    [accountId]
  );

  // Filtrar conversas por status
  const filteredConversations = state.conversations.filter(
    (conv) => !status || conv.status === status
  );

  // Auto-sincronização
  useEffect(() => {
    if (!autoSync || !accountId) return;

    const interval = setInterval(async () => {
      setState((prev) => ({ ...prev, loading: true }));
      // Aqui você poderia chamar um endpoint para buscar todas as conversas
      // Por enquanto, apenas atualiza o timestamp
      setState((prev) => ({
        ...prev,
        loading: false,
        lastSync: new Date(),
      }));
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, accountId, syncInterval]);

  return {
    ...state,
    filteredConversations,
    syncConversation,
  };
}
