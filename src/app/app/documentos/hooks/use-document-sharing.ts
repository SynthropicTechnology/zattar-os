'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarCompartilhamentos, actionCompartilharDocumento, actionAtualizarPermissao, actionRemoverCompartilhamento } from '../actions/compartilhamento-actions';
import type { DocumentoCompartilhadoComUsuario, CompartilharDocumentoParams } from '../types';

export function useDocumentSharing(documentoId: number) {
  const [shares, setShares] = useState<DocumentoCompartilhadoComUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await actionListarCompartilhamentos(documentoId);
    
    startTransition(() => {
      if (result.success) {
        setShares(result.data || []);
      } else {
        setError(result.error ?? null);
      }
      setLoading(false);
    });
  }, [documentoId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const shareDocument = useCallback(async (params: CompartilharDocumentoParams) => {
    setError(null);
    const formData = new FormData();
    formData.append('documento_id', String(params.documento_id));
    formData.append('usuario_id', String(params.usuario_id));
    formData.append('permissao', params.permissao);
    formData.append('pode_deletar', String(params.pode_deletar));

    const result = await actionCompartilharDocumento(formData);
    if (result.success) {
      fetchShares();
      return result.data;
    } else {
      setError(result.error || 'Erro ao compartilhar documento');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchShares]);

  const updatePermission = useCallback(async (compartilhamentoId: number, permissao: 'visualizar' | 'editar') => {
    setError(null);
    const result = await actionAtualizarPermissao(compartilhamentoId, permissao);
    if (result.success) {
      fetchShares();
      return result.data;
    } else {
      setError(result.error || 'Erro ao compartilhar documento');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchShares]);

  const updateDeletePermission = useCallback(async (compartilhamentoId: number, podeDeletar: boolean) => {
    setError(null);
    const result = await actionAtualizarPermissao(compartilhamentoId, undefined, podeDeletar);
    if (result.success) {
      fetchShares();
      return result.data;
    } else {
      setError(result.error || 'Erro ao compartilhar documento');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchShares]);

  const removeShare = useCallback(async (compartilhamentoId: number) => {
    setError(null);
    const result = await actionRemoverCompartilhamento(compartilhamentoId);
    if (result.success) {
      fetchShares();
    } else {
      setError(result.error || 'Erro ao compartilhar documento');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchShares]);

  return {
    shares,
    loading,
    error,
    fetchShares,
    shareDocument,
    updatePermission,
    updateDeletePermission,
    removeShare,
  };
}
