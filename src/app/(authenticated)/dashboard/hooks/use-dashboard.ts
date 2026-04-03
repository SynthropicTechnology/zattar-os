'use client';

/**
 * Hook e Context para dados da dashboard
 *
 * OTIMIZAÇÃO: Usa React Context para compartilhar dados entre todos os widgets.
 * Antes, cada widget chamava useDashboard() independentemente, causando N fetches
 * paralelos da mesma server action. Agora, um único DashboardProvider busca os
 * dados uma vez e distribui via context.
 *
 * Aceita initialData do server component para eliminar o waterfall client-side.
 */

import React, { useState, useCallback, useEffect, useContext, createContext } from 'react';
import { actionObterDashboard } from '../actions';
import type {
  DashboardData,
  DashboardUsuarioData,
  DashboardAdminData,
} from '../domain';

interface DashboardContextValue {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isAdmin: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  initialData?: DashboardData | null;
  children: React.ReactNode;
}

/**
 * Provider que busca dados da dashboard uma única vez e compartilha via context.
 * Aceita initialData do server component para renderização instantânea.
 */
export function DashboardProvider({ initialData, children }: DashboardProviderProps) {
  const [data, setData] = useState<DashboardData | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionObterDashboard();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao buscar dados da dashboard');
        setData(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar dados da dashboard';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Só busca client-side se não tiver initialData
  useEffect(() => {
    if (!initialData) {
      fetchDashboard();
    }
  }, [fetchDashboard, initialData]);

  const isAdmin = data?.role === 'admin';

  const value = React.useMemo(
    () => ({ data, isLoading, error, refetch: fetchDashboard, isAdmin }),
    [data, isLoading, error, fetchDashboard, isAdmin]
  );

  return React.createElement(DashboardContext.Provider, { value }, children);
}

/**
 * Hook para acessar dados da dashboard.
 * Deve ser usado dentro de um DashboardProvider.
 * Se usado fora do provider (fallback), busca dados independentemente.
 */
export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);

  // Fallback para uso fora do provider (compatibilidade)
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionObterDashboard();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao buscar dados da dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados da dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!context) {
      fetchDashboard();
    }
  }, [context, fetchDashboard]);

  if (context) return context;

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
    isAdmin: data?.role === 'admin',
  };
}

/**
 * Type guard para verificar se é DashboardAdminData
 */
export function isDashboardAdmin(
  data: DashboardData | null
): data is DashboardAdminData {
  return data?.role === 'admin';
}

/**
 * Type guard para verificar se é DashboardUsuarioData
 */
export function isDashboardUsuario(
  data: DashboardData | null
): data is DashboardUsuarioData {
  return data?.role === 'user';
}
