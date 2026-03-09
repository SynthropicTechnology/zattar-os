"use client";

/**
 * Hooks para DRE (Demonstração de Resultado do Exercício)
 * Usa Server Actions de features/financeiro/actions/dre
 */

import { useState, useEffect, useCallback } from "react";
import { toDateString } from "@/lib/date-utils";
import {
  actionGerarDRE,
  actionObterEvolucaoDRE,
  actionExportarDRECSV,
  actionExportarDREPDF,
  type GerarDREParams,
} from "../actions/dre";
import type {
  DRE,
  ResumoDRE,
  EvolucaoDRE,
  PeriodoDRE,
  VariacoesDRE,
} from "../domain/dre";

// ============================================================================
// Types
// ============================================================================

interface UseDREParams {
  dataInicio: string;
  dataFim: string;
  tipo?: PeriodoDRE;
  incluirComparativo?: boolean;
  incluirOrcado?: boolean;
}

interface UseDREResult {
  dre: DRE | null;
  comparativo: {
    periodoAnterior: DRE | null;
    orcado: ResumoDRE | null;
    variacoes: VariacoesDRE | null;
    variacoesOrcado: VariacoesDRE | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseEvolucaoDREParams {
  ano: number;
}

interface UseEvolucaoDREResult {
  evolucao: EvolucaoDRE[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseExportarDREResult {
  isExporting: boolean;
  error: string | null;
  exportarPDF: (
    dataInicio: string,
    dataFim: string,
    tipo?: PeriodoDRE
  ) => Promise<void>;
  exportarCSV: (
    dataInicio: string,
    dataFim: string,
    tipo?: PeriodoDRE
  ) => Promise<void>;
}

// ============================================================================
// Hook Principal - DRE
// ============================================================================

/**
 * Hook para buscar DRE com comparativos opcionais
 */
export const useDRE = (params: UseDREParams): UseDREResult => {
  const [dre, setDRE] = useState<DRE | null>(null);
  const [comparativo, setComparativo] =
    useState<UseDREResult["comparativo"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarDRE = useCallback(async () => {
    if (!params.dataInicio || !params.dataFim) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const actionParams: GerarDREParams = {
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
        tipo: params.tipo,
        incluirComparativo: params.incluirComparativo,
        incluirOrcado: params.incluirOrcado,
      };

      const result = await actionGerarDRE(actionParams);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Erro ao buscar DRE");
      }

      setDRE(result.data.dre || null);
      setComparativo(
        result.data.comparativo
          ? {
              periodoAnterior: result.data.comparativo.periodoAnterior || null,
              orcado: result.data.comparativo.orcado?.resumo || null,
              variacoes:
                (result.data.comparativo
                  .variacoes as unknown as VariacoesDRE) || null,
              variacoesOrcado:
                (result.data.comparativo
                  .variacoesOrcado as unknown as VariacoesDRE) || null,
            }
          : null
      );
    } catch (err) {
      console.error("Erro ao buscar DRE:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar DRE");
      setDRE(null);
      setComparativo(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.dataInicio,
    params.dataFim,
    params.tipo,
    params.incluirComparativo,
    params.incluirOrcado,
  ]);

  useEffect(() => {
    if (params.dataInicio && params.dataFim) {
      buscarDRE();
    }
  }, [buscarDRE, params.dataInicio, params.dataFim]);

  return {
    dre,
    comparativo,
    isLoading,
    error,
    refetch: buscarDRE,
  };
};

// ============================================================================
// Hook - Evolução DRE
// ============================================================================

/**
 * Hook para buscar evolução mensal do DRE
 */
export const useEvolucaoDRE = (
  params: UseEvolucaoDREParams
): UseEvolucaoDREResult => {
  const [evolucao, setEvolucao] = useState<EvolucaoDRE[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarEvolucao = useCallback(async () => {
    if (!params.ano) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionObterEvolucaoDRE(params.ano);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Erro ao buscar evolução DRE");
      }

      setEvolucao(result.data.evolucao || []);
    } catch (err) {
      console.error("Erro ao buscar evolução DRE:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao buscar evolução DRE"
      );
      setEvolucao([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.ano]);

  useEffect(() => {
    if (params.ano) {
      buscarEvolucao();
    }
  }, [buscarEvolucao, params.ano]);

  return {
    evolucao,
    isLoading,
    error,
    refetch: buscarEvolucao,
  };
};

// ============================================================================
// Hook - Exportação DRE
// ============================================================================

/**
 * Hook para exportar DRE em diferentes formatos
 */
export const useExportarDRE = (): UseExportarDREResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportarPDF = useCallback(
    async (dataInicio: string, dataFim: string, tipo?: PeriodoDRE) => {
      setIsExporting(true);
      setError(null);

      try {
        const result = await actionExportarDREPDF({
          dataInicio,
          dataFim,
          tipo,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || "Erro ao exportar PDF");
        }

        // Converter base64 para blob e fazer download
        const byteCharacters = atob(result.data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Erro ao exportar PDF:", err);
        setError(err instanceof Error ? err.message : "Erro ao exportar PDF");
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportarCSV = useCallback(
    async (dataInicio: string, dataFim: string, tipo?: PeriodoDRE) => {
      setIsExporting(true);
      setError(null);

      try {
        const result = await actionExportarDRECSV({
          dataInicio,
          dataFim,
          tipo,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || "Erro ao exportar CSV");
        }

        // Download do arquivo
        const blob = new Blob([result.data.content], {
          type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Erro ao exportar CSV:", err);
        setError(err instanceof Error ? err.message : "Erro ao exportar CSV");
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    error,
    exportarPDF,
    exportarCSV,
  };
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Gera datas para período atual baseado no tipo
 */
export const gerarPeriodoAtual = (
  tipo: PeriodoDRE
): { dataInicio: string; dataFim: string } => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  switch (tipo) {
    case "mensal": {
      const dataInicio = new Date(ano, mes, 1);
      const dataFim = new Date(ano, mes + 1, 0);
      return {
        dataInicio: toDateString(dataInicio),
        dataFim: toDateString(dataFim),
      };
    }
    case "trimestral": {
      const trimestre = Math.floor(mes / 3);
      const mesInicio = trimestre * 3;
      const dataInicio = new Date(ano, mesInicio, 1);
      const dataFim = new Date(ano, mesInicio + 3, 0);
      return {
        dataInicio: toDateString(dataInicio),
        dataFim: toDateString(dataFim),
      };
    }
    case "anual":
    default: {
      return {
        dataInicio: `${ano}-01-01`,
        dataFim: `${ano}-12-31`,
      };
    }
  }
};

/**
 * Gera datas para período anterior
 */
export const gerarPeriodoAnterior = (
  dataInicio: string,
  dataFim: string
): { dataInicio: string; dataFim: string } => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  // Calcular diferença em meses
  const mesesDiff =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth()) +
    1;

  // Subtrair mesma quantidade de meses
  const novoInicio = new Date(inicio);
  novoInicio.setMonth(novoInicio.getMonth() - mesesDiff);

  const novoFim = new Date(inicio);
  novoFim.setDate(novoFim.getDate() - 1);

  return {
    dataInicio: toDateString(novoInicio),
    dataFim: toDateString(novoFim),
  };
};
