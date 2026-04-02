'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarDocumentos } from '../actions/documentos-actions';
import type { DocumentoComUsuario, ListarDocumentosParams } from '../types';

export type DocumentFetcher = (params: ListarDocumentosParams) => Promise<{ success: boolean; data?: DocumentoComUsuario[]; total?: number; error?: string }>;

export function useDocumentsList(
  initialParams?: ListarDocumentosParams,
  fetcher: DocumentFetcher = actionListarDocumentos
) {
  const [documents, setDocuments] = useState<DocumentoComUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarDocumentosParams>(initialParams || {});

  const fetchDocuments = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await fetcher(params);
    
    startTransition(() => {
      if (result.success) {
        setDocuments(result.data || []);
        setTotal(result.total || 0);
      } else {
        setError(result.error || 'Erro desconhecido');
      }
      setLoading(false);
    });
  }, [params, fetcher]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const updateParams = useCallback((newParams: Partial<ListarDocumentosParams>) => {
    setParams((prevParams: ListarDocumentosParams) => ({ ...prevParams, ...newParams }));
  }, []);

  return {
    documents,
    total,
    loading,
    error,
    params,
    updateParams,
    refetch: fetchDocuments,
  };
}
