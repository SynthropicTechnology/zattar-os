"use client";

import { useState, useEffect, useCallback } from "react";
import { actionDocumentosStats } from "../actions/documentos-actions";
import type { DocumentosStats } from "../services/documentos.service";

/**
 * Hook para buscar stats de documentos de assinatura digital.
 *
 * Usado pelo StatsStrip e SignaturePipeline.
 */
export function useDocumentosStats(initialStats?: DocumentosStats) {
  const [stats, setStats] = useState<DocumentosStats | null>(initialStats ?? null);
  const [loading, setLoading] = useState(!initialStats);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await actionDocumentosStats({});
      if (result?.success && result.data) {
        setStats(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialStats) {
      refresh();
    }
  }, [initialStats, refresh]);

  return { stats, loading, refresh };
}
