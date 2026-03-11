'use client';

import { useState, useCallback } from 'react';
import type { EntrevistaTrabalhista, TipoLitigio, PerfilReclamante, ModuloEntrevista } from '../domain';
import {
  iniciarEntrevistaAction,
  salvarModuloAction,
  finalizarEntrevistaAction,
  reabrirEntrevistaAction,
} from '../actions/entrevista-actions';
import { uploadAnexoAction, deleteAnexoAction } from '../actions/anexo-actions';

interface UseEntrevistaResult {
  isLoading: boolean;
  error: string | null;
  iniciar: (
    contratoId: number,
    tipoLitigio: TipoLitigio,
    perfilReclamante?: PerfilReclamante,
    createdBy?: number | null,
  ) => Promise<EntrevistaTrabalhista | null>;
  salvarModulo: (
    entrevistaId: number,
    contratoId: number,
    modulo: ModuloEntrevista,
    respostas: Record<string, unknown>,
    avancar?: boolean,
    notaOperador?: string,
  ) => Promise<EntrevistaTrabalhista | null>;
  finalizar: (
    entrevistaId: number,
    contratoId: number,
    testemunhasMapeadas: boolean,
  ) => Promise<EntrevistaTrabalhista | null>;
  reabrir: (
    entrevistaId: number,
    contratoId: number,
  ) => Promise<EntrevistaTrabalhista | null>;
  uploadAnexo: (
    entrevistaId: number,
    contratoId: number,
    modulo: string,
    noReferencia: string | undefined,
    tipoAnexo: string,
    arquivoUrl: string,
    descricao?: string,
  ) => Promise<boolean>;
  deleteAnexo: (
    anexoId: number,
    contratoId: number,
  ) => Promise<boolean>;
}

export function useEntrevista(): UseEntrevistaResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciar = useCallback(
    async (
      contratoId: number,
      tipoLitigio: TipoLitigio,
      perfilReclamante?: PerfilReclamante,
      createdBy?: number | null,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await iniciarEntrevistaAction(
          contratoId,
          tipoLitigio,
          perfilReclamante,
          createdBy,
        );
        if (!result.success) {
          setError(result.error);
          return null;
        }
        return result.data as EntrevistaTrabalhista;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao iniciar entrevista';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const salvarModuloFn = useCallback(
    async (
      entrevistaId: number,
      contratoId: number,
      modulo: ModuloEntrevista,
      respostas: Record<string, unknown>,
      avancar = false,
      notaOperador?: string,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await salvarModuloAction(
          entrevistaId,
          contratoId,
          modulo,
          respostas,
          avancar,
          notaOperador,
        );
        if (!result.success) {
          setError(result.error);
          return null;
        }
        return result.data as EntrevistaTrabalhista;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar módulo';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const finalizar = useCallback(
    async (
      entrevistaId: number,
      contratoId: number,
      testemunhasMapeadas: boolean,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await finalizarEntrevistaAction(
          entrevistaId,
          contratoId,
          testemunhasMapeadas,
        );
        if (!result.success) {
          setError(result.error);
          return null;
        }
        return result.data as EntrevistaTrabalhista;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao finalizar entrevista';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reabrir = useCallback(
    async (entrevistaId: number, contratoId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await reabrirEntrevistaAction(entrevistaId, contratoId);
        if (!result.success) {
          setError(result.error);
          return null;
        }
        return result.data as EntrevistaTrabalhista;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao reabrir entrevista';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const uploadAnexoFn = useCallback(
    async (
      entrevistaId: number,
      contratoId: number,
      modulo: string,
      noReferencia: string | undefined,
      tipoAnexo: string,
      arquivoUrl: string,
      descricao?: string,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await uploadAnexoAction(
          entrevistaId,
          contratoId,
          modulo,
          noReferencia,
          tipoAnexo,
          arquivoUrl,
          descricao,
        );
        if (!result.success) {
          setError(result.error);
          return false;
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao enviar anexo';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteAnexoFn = useCallback(
    async (anexoId: number, contratoId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await deleteAnexoAction(anexoId, contratoId);
        if (!result.success) {
          setError(result.error);
          return false;
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir anexo';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    iniciar,
    salvarModulo: salvarModuloFn,
    finalizar,
    reabrir,
    uploadAnexo: uploadAnexoFn,
    deleteAnexo: deleteAnexoFn,
  };
}
