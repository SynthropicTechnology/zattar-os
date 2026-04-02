'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarPastas, actionCriarPasta, actionDeletarPasta, actionMoverDocumento } from '../actions/pastas-actions';
import type { PastaComContadores } from '../types';

export function useFolders() {
  const [folders, setFolders] = useState<PastaComContadores[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await actionListarPastas();
    
    startTransition(() => {
      if (result.success) {
        setFolders(result.data || []);
      } else {
        setError(result.error ?? null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (name: string, parentId: number | null, type: 'comum' | 'privada') => {
    setError(null);
    const formData = new FormData();
    formData.append('nome', name);
    if (parentId !== null) formData.append('pasta_pai_id', String(parentId));
    formData.append('tipo', type);

    const result = await actionCriarPasta(formData);
    if (result.success) {
      fetchFolders(); // Refetch all folders to update the list
      return result.data;
    } else {
      setError(result.error ?? null);
      throw new Error(result.error ?? 'Erro ao criar pasta');
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (id: number) => {
    setError(null);
    const result = await actionDeletarPasta(id);
    if (result.success) {
      fetchFolders(); // Refetch all folders to update the list
    } else {
      setError(result.error ?? null);
      throw new Error(result.error ?? 'Erro ao deletar pasta');
    }
  }, [fetchFolders]);

  const moveDocumentToFolder = useCallback(async (documentoId: number, newFolderId: number | null) => {
    setError(null);
    const result = await actionMoverDocumento(documentoId, newFolderId);
    if (result.success) {
      // Potentially refetch documents list if needed, or update cache
    } else {
      setError(result.error ?? null);
      throw new Error(result.error ?? 'Erro ao mover documento');
    }
  }, []);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    deleteFolder,
    moveDocumentToFolder,
  };
}
