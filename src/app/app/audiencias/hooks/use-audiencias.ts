"use client";

/**
 * Hook para buscar audiências
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  Audiencia,
  BuscarAudienciasParams,
  UseAudienciasResult,
  UseAudienciasOptions,
} from "../domain";
import { actionListarAudiencias } from "../actions";

// Verificação SSR - retorna true se estiver rodando no cliente
const isClient = typeof window !== "undefined";

/**
 * Hook para buscar audiências com filtros e paginação
 */
export const useAudiencias = (
  params: BuscarAudienciasParams = {},
  options: UseAudienciasOptions = {}
): UseAudienciasResult => {
  const { enabled = true } = options;
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [paginacao, setPaginacao] =
    useState<UseAudienciasResult["paginacao"]>(null);
  // Durante SSR, não mostrar loading para evitar flash
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce busca textual para evitar múltiplas requisições durante digitação
  const buscaDebounced = useDebounce(params.busca, 300);

  // Parâmetros estáveis (sem busca) para evitar re-render desnecessário
  const paramsEstaveis = useMemo(
    () => ({
      pagina: params.pagina,
      limite: params.limite,
      trt: params.trt,
      grau: params.grau,
      responsavel_id: params.responsavel_id,
      status: params.status,
      modalidade: params.modalidade,
      tipo_audiencia_id: params.tipo_audiencia_id,
      data_inicio_inicio: params.data_inicio_inicio,
      data_inicio_fim: params.data_inicio_fim,
      data_fim_inicio: params.data_fim_inicio,
      data_fim_fim: params.data_fim_fim,
      ordenar_por: params.ordenar_por,
      ordem: params.ordem,
    }),
    [
      params.pagina,
      params.limite,
      params.trt,
      params.grau,
      params.responsavel_id,
      params.status,
      params.modalidade,
      params.tipo_audiencia_id,
      params.data_inicio_inicio,
      params.data_inicio_fim,
      params.data_fim_inicio,
      params.data_fim_fim,
      params.ordenar_por,
      params.ordem,
    ]
  );

  const buscarAudiencias = useCallback(async () => {
    // Não executar durante SSR/SSG
    if (!isClient) {
      return;
    }

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarAudiencias({
        pagina: paramsEstaveis.pagina,
        limite: paramsEstaveis.limite,
        busca: buscaDebounced,
        trt: paramsEstaveis.trt,
        grau: paramsEstaveis.grau,
        responsavelId: paramsEstaveis.responsavel_id,
        status: paramsEstaveis.status,
        modalidade: paramsEstaveis.modalidade,
        tipoAudienciaId: paramsEstaveis.tipo_audiencia_id,
        dataInicioInicio: paramsEstaveis.data_inicio_inicio,
        dataInicioFim: paramsEstaveis.data_inicio_fim,
        dataFimInicio: paramsEstaveis.data_fim_inicio,
        dataFimFim: paramsEstaveis.data_fim_fim,
        ordenarPor: paramsEstaveis.ordenar_por,
        ordem: paramsEstaveis.ordem,
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar audiências");
      }

      const payload = result.data;
      setAudiencias(payload.data);
      setPaginacao({
        pagina: payload.pagination.page,
        limite: payload.pagination.limit,
        total: payload.pagination.total,
        totalPaginas: payload.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar audiências";
      setError(errorMessage);
      setAudiencias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [paramsEstaveis, buscaDebounced, enabled]);

  useEffect(() => {
    buscarAudiencias();
  }, [buscarAudiencias]);

  return {
    audiencias,
    paginacao,
    isLoading,
    error,
    refetch: buscarAudiencias,
  };
};
