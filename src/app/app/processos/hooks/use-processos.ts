'use client';

/**
 * Hook para buscar processos usando Server Actions
 *
 * Substitui o antigo useAcervo que chamava /api/acervo.
 * Agora usa actionListarProcessos do core de processos.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { actionListarProcessos } from '../actions';
import type { ListarProcessosParams, Processo, ProcessoUnificado } from '../domain';
import { useDeepCompareMemo } from '@/hooks/use-render-count';

interface UseProcessosResult {
  processos: (Processo | ProcessoUnificado)[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Converte parametros do formato antigo (snake_case) para o novo (camelCase)
 */
function convertParams(params: Record<string, unknown>): ListarProcessosParams {
  const converted: ListarProcessosParams = {};

  // Paginacao
  if (params.pagina !== undefined) converted.pagina = Number(params.pagina);
  if (params.limite !== undefined) converted.limite = Number(params.limite);

  // Busca
  if (params.busca) converted.busca = String(params.busca);

  // Ordenacao (converter snake_case para camelCase)
  if (params.ordenar_por) {
    converted.ordenarPor = String(params.ordenar_por) as ListarProcessosParams['ordenarPor'];
  }
  if (params.ordem) {
    converted.ordem = String(params.ordem) as 'asc' | 'desc';
  }

  // Filtros de identificacao
  if (params.origem) converted.origem = String(params.origem) as ListarProcessosParams['origem'];
  if (params.trt) converted.trt = String(params.trt);
  if (params.grau) converted.grau = String(params.grau) as ListarProcessosParams['grau'];
  if (params.numero_processo) converted.numeroProcesso = String(params.numero_processo);
  if (params.classe_judicial) converted.classeJudicial = String(params.classe_judicial);
  if (params.codigo_status_processo) converted.codigoStatusProcesso = String(params.codigo_status_processo);

  // Filtros de partes
  if (params.nome_parte_autora) converted.nomeParteAutora = String(params.nome_parte_autora);
  if (params.nome_parte_re) converted.nomeParteRe = String(params.nome_parte_re);
  if (params.descricao_orgao_julgador) converted.descricaoOrgaoJulgador = String(params.descricao_orgao_julgador);

  // Filtros booleanos
  if (params.segredo_justica !== undefined) converted.segredoJustica = Boolean(params.segredo_justica);
  if (params.juizo_digital !== undefined) converted.juizoDigital = Boolean(params.juizo_digital);
  if (params.tem_associacao !== undefined) converted.temAssociacao = Boolean(params.tem_associacao);
  if (params.tem_proxima_audiencia !== undefined) converted.temProximaAudiencia = Boolean(params.tem_proxima_audiencia);
  if (params.sem_responsavel !== undefined) converted.semResponsavel = Boolean(params.sem_responsavel);

  // Filtros de data
  if (params.data_autuacao_inicio) converted.dataAutuacaoInicio = String(params.data_autuacao_inicio);
  if (params.data_autuacao_fim) converted.dataAutuacaoFim = String(params.data_autuacao_fim);
  if (params.data_arquivamento_inicio) converted.dataArquivamentoInicio = String(params.data_arquivamento_inicio);
  if (params.data_arquivamento_fim) converted.dataArquivamentoFim = String(params.data_arquivamento_fim);
  if (params.data_proxima_audiencia_inicio) converted.dataProximaAudienciaInicio = String(params.data_proxima_audiencia_inicio);
  if (params.data_proxima_audiencia_fim) converted.dataProximaAudienciaFim = String(params.data_proxima_audiencia_fim);

  // Filtros de relacionamento
  if (params.advogado_id) converted.advogadoId = Number(params.advogado_id);
  if (params.responsavel_id) converted.responsavelId = Number(params.responsavel_id);
  if (params.cliente_id) converted.clienteId = Number(params.cliente_id);

  // Opcao unified
  if (params.unified !== undefined) converted.unified = Boolean(params.unified);

  return converted;
}

/**
 * Converte resposta do novo formato para o formato esperado pela UI
 */
function convertProcessoToLegacy(processo: Processo | ProcessoUnificado): Processo | ProcessoUnificado {
  // Os campos ja vem em camelCase do core, mas a UI espera snake_case
  // Precisamos converter de volta para compatibilidade
  const isUnificado = 'instances' in processo;

  const legacy: Record<string, unknown> = {
    id: processo.id,
    id_pje: processo.idPje,
    advogado_id: processo.advogadoId,
    trt: processo.trt,
    numero_processo: processo.numeroProcesso,
    numero: processo.numero,
    descricao_orgao_julgador: processo.descricaoOrgaoJulgador,
    classe_judicial: processo.classeJudicial,
    segredo_justica: processo.segredoJustica,
    codigo_status_processo: processo.codigoStatusProcesso,
    prioridade_processual: processo.prioridadeProcessual,
    nome_parte_autora: processo.nomeParteAutora,
    qtde_parte_autora: processo.qtdeParteAutora,
    nome_parte_re: processo.nomeParteRe,
    qtde_parte_re: processo.qtdeParteRe,
    data_autuacao: processo.dataAutuacao,
    juizo_digital: processo.juizoDigital,
    data_arquivamento: processo.dataArquivamento,
    data_proxima_audiencia: processo.dataProximaAudiencia,
    tem_associacao: processo.temAssociacao,
    responsavel_id: processo.responsavelId,
    created_at: processo.createdAt,
    updated_at: processo.updatedAt,
    status: processo.status,
  };

  if (isUnificado) {
    const unificado = processo as ProcessoUnificado;
    legacy.grau_atual = unificado.grauAtual;
    legacy.status_geral = unificado.statusGeral;
    legacy.graus_ativos = unificado.grausAtivos;
    legacy.instances = unificado.instances?.map((inst) => ({
      id: inst.id,
      grau: inst.grau,
      origem: inst.origem,
      trt: inst.trt,
      data_autuacao: inst.dataAutuacao,
      status: inst.status,
      updated_at: inst.updatedAt,
      is_grau_atual: inst.isGrauAtual,
    }));
  } else {
    const proc = processo as Processo;
    legacy.grau = proc.grau;
    legacy.origem = proc.origem;
  }

  return legacy as unknown as Processo | ProcessoUnificado;
}

/**
 * Hook para buscar processos usando o novo core
 */
export const useProcessos = (params: Record<string, unknown> = {}): UseProcessosResult => {
  const [processos, setProcessos] = useState<(Processo | ProcessoUnificado)[]>([]);
  const [paginacao, setPaginacao] = useState<UseProcessosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Usar comparação profunda para estabilizar params
  // Evita re-renders quando objeto params tem mesmos valores mas referência diferente
  const convertedParams = useDeepCompareMemo(() => convertParams(params), [params]);

  const buscarProcessos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarProcessos(convertedParams);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar processos');
      }

      const data = result.data as {
        data: (Processo | ProcessoUnificado)[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };

      // Converter processos para formato legado (snake_case)
      const processosConvertidos = data.data.map(convertProcessoToLegacy);

      setProcessos(processosConvertidos);
      setPaginacao({
        pagina: data.pagination.page,
        limite: data.pagination.limit,
        total: data.pagination.total,
        totalPaginas: data.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar processos';
      setError(errorMessage);
      setProcessos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [convertedParams]);

  useEffect(() => {
    // Skip primeira execução se necessário (dependendo do caso de uso)
    // Para manter comportamento atual, executamos na primeira render
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }

    buscarProcessos();
  }, [buscarProcessos]);

  return {
    processos,
    paginacao,
    isLoading,
    error,
    refetch: buscarProcessos,
  };
};

// Alias para compatibilidade com codigo antigo
export { useProcessos as useAcervo };
