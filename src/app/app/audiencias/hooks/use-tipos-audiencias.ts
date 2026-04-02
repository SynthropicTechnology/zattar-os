"use client";

/**
 * Hook para buscar tipos de audiências (deduplicados por descrição)
 */

import { useState, useEffect, useCallback } from "react";
import type { TipoAudiencia, UseTiposAudienciasResult } from "../domain";
import { actionListarTiposAudiencia } from "../actions";

// Verificação SSR - retorna true se estiver rodando no cliente
const isClient = typeof window !== "undefined";

interface UseTiposAudienciasParams {
  limite?: number;
  /** Se false, não faz fetch (útil quando dados são passados via props) */
  enabled?: boolean;
}

/**
 * Hook para buscar tipos de audiências disponíveis
 * Retorna lista deduplicada (sem filtro por TRT/grau)
 */
export function useTiposAudiencias(
  params?: UseTiposAudienciasParams
): UseTiposAudienciasResult & { refetch: () => void } {
  const enabled = params?.enabled ?? true;
  const [tiposAudiencia, setTiposAudiencia] = useState<TipoAudiencia[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    // Não executar durante SSR/SSG ou se desabilitado
    if (!isClient || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarTiposAudiencia({
        limite: params?.limite,
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar tipos de audiência.");
      }

      setTiposAudiencia((result.data as unknown as TipoAudiencia[]) || []);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Erro ao carregar tipos de audiência.";
      setError(errorMessage);
      setTiposAudiencia([]);
    } finally {
      setIsLoading(false);
    }
  }, [params?.limite, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tiposAudiencia, isLoading, error, refetch };
}
