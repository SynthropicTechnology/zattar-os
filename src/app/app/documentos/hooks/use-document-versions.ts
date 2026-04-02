'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarVersoes, actionRestaurarVersao } from '../actions/versoes-actions';
import type { DocumentoVersaoComUsuario } from '../types';

export function useDocumentVersions(documentoId: number) {
  const [versions, setVersions] = useState<DocumentoVersaoComUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await actionListarVersoes(documentoId);
    
    startTransition(() => {
      if (result.success) {
        setVersions(result.data || []);
        setTotal(result.total || 0);
      } else {
        setError(result.error ?? null);
      }
      setLoading(false);
    });
  }, [documentoId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const restoreVersion = useCallback(async (versionId: number) => {
    setError(null);
    const result = await actionRestaurarVersao(versionId);
    if (result.success) {
      fetchVersions(); // Refetch versions list after restore
      return result.data;
    } else {
      setError(result.error ?? null);
      throw new Error(result.error ?? 'Erro ao restaurar versão');
    }
  }, [fetchVersions]);

  return {
    versions,
    total,
    loading,
    error,
    fetchVersions,
    restoreVersion,
  };
}
