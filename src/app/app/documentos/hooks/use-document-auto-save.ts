import { useEffect, useRef, useState, useCallback } from 'react';
import { actionAutoSalvar } from '../actions/documentos-actions';
import type { AutoSavePayload } from '../types';

interface UseDocumentAutoSaveOptions {
  documentoId: number;
  onSave?: (data: AutoSavePayload) => void;
  onError?: (error: string) => void;
  debounceTime?: number; // milliseconds
}

export function useDocumentAutoSave(payload: AutoSavePayload | undefined, options: UseDocumentAutoSaveOptions) {
  const { documentoId, onSave, onError, debounceTime = 2000 } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveDocument = useCallback(async (currentPayload: AutoSavePayload) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('documento_id', String(currentPayload.documento_id));
      formData.append('conteudo', JSON.stringify(currentPayload.conteudo));
      if (currentPayload.titulo) formData.append('titulo', currentPayload.titulo);

      const result = await actionAutoSalvar(documentoId, formData);
      if (result.success) {
        setLastSaved(new Date());
        onSave?.(currentPayload);
      } else {
        setSaveError(result.error ?? null);
        onError?.(result.error ?? 'Erro desconhecido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar.';
      setSaveError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [documentoId, onSave, onError]);

  // Check for deep equality or rely on stringified comparison
  const payloadString = JSON.stringify(payload);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Only auto-save if payload is defined and content is available
    if (payload && payload.conteudo) {
      timerRef.current = setTimeout(() => {
        saveDocument(payload);
      }, debounceTime);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadString, debounceTime, saveDocument]);

  return { isSaving, lastSaved, saveError };
}
