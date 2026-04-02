'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionBuscarDocumento, actionAtualizarDocumento } from '../actions/documentos-actions';
import type { DocumentoComUsuario, AtualizarDocumentoParams } from '../types';

export function useDocument(documentoId: number) {
  const [documento, setDocumento] = useState<DocumentoComUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await actionBuscarDocumento(documentoId);
    
    startTransition(() => {
      if (result.success) {
        setDocumento(result.data ?? null);
      } else {
        setError(result.error ?? null);
      }
      setLoading(false);
    });
  }, [documentoId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const saveDocument = useCallback(async (params: AtualizarDocumentoParams) => {
    setSaving(true);
    setError(null);
    const formData = new FormData();
    if (params.titulo !== undefined) formData.append('titulo', params.titulo);
    if (params.conteudo !== undefined) formData.append('conteudo', JSON.stringify(params.conteudo));
    if (params.pasta_id !== undefined) formData.append('pasta_id', String(params.pasta_id));
    if (params.descricao !== undefined) formData.append('descricao', params.descricao ?? '');
    if (params.tags !== undefined) formData.append('tags', JSON.stringify(params.tags));

    const result = await actionAtualizarDocumento(documentoId, formData);
    if (result.success) {
      setDocumento(result.data ?? null);
    } else {
      setError(result.error ?? null);
    }
    setSaving(false);
    return result;
  }, [documentoId]);

  return { documento, loading, saving, error, saveDocument, reloadDocument: loadDocument };
}
