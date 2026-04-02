/**
 * Hook para gerenciar agentes/usuários Chatwoot
 * 
 * Fornece funcionalidades para buscar, filtrar e monitorar agentes
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UsuarioChatwoot } from '../domain';

// =============================================================================
// Types
// =============================================================================

export interface UseChatwootAgentsOptions {
  /** Account ID do Chatwoot */
  accountId?: number;
  /** Filtrar apenas agentes disponíveis (padrão: false) */
  onlyAvailable?: boolean;
  /** Habilidades requeridas para filtro (padrão: nenhuma) */
  requiredSkills?: string[];
  /** Auto-atualizar ao montar (padrão: false) */
  autoRefresh?: boolean;
  /** Intervalo de atualização em ms (padrão: 60s) */
  refreshInterval?: number;
}

export interface UseChatwootAgentsState {
  agents: UsuarioChatwoot[];
  loading: boolean;
  error: Error | null;
  lastRefresh: Date | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook para gerenciar agentes Chatwoot
 * 
 * @example
 * ```tsx
 * const { agents, loading } = useChatwootAgents({
 *   accountId: 1,
 *   onlyAvailable: true,
 *   requiredSkills: ['legal']
 * });
 * ```
 */
export function useChatwootAgents(
  options: UseChatwootAgentsOptions = {}
) {
  const {
    accountId,
    onlyAvailable = false,
    requiredSkills = [],
    autoRefresh = false,
    refreshInterval = 60000,
  } = options;

  const [state, setState] = useState<UseChatwootAgentsState>({
    agents: [],
    loading: false,
    error: null,
    lastRefresh: null,
  });

  // Filtrar agentes
  const filteredAgents = state.agents.filter((agent) => {
    if (onlyAvailable && !agent.disponivel) return false;
    if (requiredSkills.length > 0) {
      const agentSkills = agent.skills || [];
      const hasRequiredSkill = requiredSkills.some((skill) =>
        agentSkills.includes(skill)
      );
      if (!hasRequiredSkill) return false;
    }
    return true;
  });

  // Ordenar por carga (menos conversas ativas primeiro)
  const sortedAgents = [...filteredAgents].sort(
    (a, b) =>
      Number(a.contador_conversas_ativas) -
      Number(b.contador_conversas_ativas)
  );

  // Obter agente com menor carga
  const agentWithLowestLoad = sortedAgents[0] || null;

  // Auto-atualizar
  useEffect(() => {
    if (!autoRefresh || !accountId) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        lastRefresh: new Date(),
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, accountId, refreshInterval]);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setState((prev) => ({
        ...prev,
        error: new Error('Account ID não fornecido'),
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      // Simula busca - em um cenário real, buscaria da API
      setState((prev) => ({
        ...prev,
        loading: false,
        lastRefresh: new Date(),
      }));
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        error: errorObj,
        loading: false,
      }));
    }
  }, [accountId]);

  return {
    ...state,
    agents: sortedAgents,
    agentWithLowestLoad,
    refresh,
  };
}

/**
 * Hook para monitorar disponibilidade de um agente
 */
export function useChatwootAgentAvailability(
  agentId: string,
  options: { autoRefresh?: boolean; refreshInterval?: number } = {}
) {
  const { autoRefresh = false, refreshInterval = 10000 } = options;

  const [state, setState] = useState<{
    available: boolean;
    lastUpdate: Date | null;
    loading: boolean;
  }>({
    available: false,
    lastUpdate: null,
    loading: false,
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simula busca de status
      setState((prev) => ({
        ...prev,
        lastUpdate: new Date(),
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return state;
}
