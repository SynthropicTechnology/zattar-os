/**
 * Serviço para buscar dados complementares de processos do PJE-TRT
 * 
 * Este serviço aproveita uma sessão autenticada para buscar múltiplos dados
 * de processos em sequência, otimizando o uso da conexão.
 * 
 * Dados complementares incluem:
 * - Timeline (movimentos e documentos)
 * - Partes (autores, réus, terceiros, representantes)
 */

import type { Page } from 'playwright';
import type { CodigoTRT, GrauTRT } from './types';
import type { TimelineResponse, TimelineItem } from '@/types/contracts/pje-trt';
import type { PartePJE } from '@/app/(authenticated)/captura/pje-trt/partes/types';
import { obterTimeline } from '@/app/(authenticated)/captura/pje-trt/timeline/obter-timeline';
import { obterPartesProcesso } from '@/app/(authenticated)/captura/pje-trt/partes';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Configurações para busca de dados complementares
 */
export interface DadosComplementaresOptions {
  /** Buscar timeline (movimentos + documentos) */
  buscarTimeline?: boolean;
  /** Buscar partes do processo */
  buscarPartes?: boolean;
  /** Código do TRT */
  trt: CodigoTRT;
  /** Grau da instância */
  grau: GrauTRT;
  /** Delay entre requisições em ms (rate limiting) */
  delayEntreRequisicoes?: number;
  /** Callback para progresso */
  onProgress?: (atual: number, total: number, processoId: number) => void;
  /** Verificar se processo precisa recaptura (baseado em updated_at do acervo) */
  verificarRecaptura?: boolean;
  /** Horas mínimas desde última atualização para recapturar (default: 24) */
  horasParaRecaptura?: number;
}

/**
 * Dados complementares de um processo
 */
export interface DadosComplementaresProcesso {
  processoId: number;
  timeline?: TimelineResponse;
  partes?: PartePJE[];
  payloadBrutoPartes?: Record<string, unknown> | null;
  erros: Array<{ tipo: 'timeline' | 'partes'; erro: string }>;
}

/**
 * Resultado da busca de dados complementares
 */
export interface DadosComplementaresResult {
  /** Dados por processo (Map: processoId -> dados) */
  porProcesso: Map<number, DadosComplementaresProcesso>;
  /** Resumo da operação */
  resumo: {
    totalProcessos: number;
    processosPulados: number;
    timelinesObtidas: number;
    partesObtidas: number;
    erros: number;
  };
  /** Lista de erros detalhados */
  errosDetalhados: Array<{ processoId: number; tipo: string; erro: string }>;
}

/**
 * Opções para verificação de recaptura
 */
interface RecapturaOptions {
  /** Horas mínimas desde última atualização para recapturar (default: 24) */
  horasParaRecaptura?: number;
  /** TRT do processo */
  trt: string;
  /** Grau do processo */
  grau: string;
}

/**
 * Verifica quais processos precisam ser recapturados baseado no updated_at do acervo
 * 
 * @param processosIds - Lista de IDs de processos do PJE
 * @param options - Opções de verificação
 * @returns Lista de IDs que precisam ser recapturados (não atualizados recentemente)
 */
async function verificarProcessosParaRecaptura(
  processosIds: number[],
  options: RecapturaOptions
): Promise<{ paraRecapturar: number[]; pulados: number[] }> {
  const horasMinimas = options.horasParaRecaptura ?? 24;
  const dataLimite = new Date(Date.now() - horasMinimas * 60 * 60 * 1000);

  const supabase = createServiceClient();

  // Buscar processos atualizados recentemente no acervo
  const { data, error } = await supabase
    .from('acervo')
    .select('id_pje, updated_at')
    .in('id_pje', processosIds)
    .eq('trt', options.trt)
    .eq('grau', options.grau);

  if (error) {
    console.warn(`⚠️ [Recaptura] Erro ao verificar processos: ${error.message}. Capturando todos.`);
    return { paraRecapturar: processosIds, pulados: [] };
  }

  // Criar Set de processos atualizados recentemente
  const processosRecentes = new Set(
    (data ?? [])
      .filter(p => new Date(p.updated_at) > dataLimite)
      .map(p => p.id_pje as number)
  );

  // Separar processos que precisam recaptura dos que podem ser pulados
  const paraRecapturar = processosIds.filter(id => !processosRecentes.has(id));
  const pulados = processosIds.filter(id => processosRecentes.has(id));

  return { paraRecapturar, pulados };
}

/**
 * Delay entre requisições
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca dados complementares de múltiplos processos
 * Faz chamadas em sequência com delay para evitar rate limiting
 * 
 * @param page - Página autenticada do Playwright
 * @param processosIds - Lista de IDs de processos únicos
 * @param options - Opções de busca
 * @returns Dados complementares de todos os processos
 */
export async function buscarDadosComplementaresProcessos(
  page: Page,
  processosIds: number[],
  options: DadosComplementaresOptions
): Promise<DadosComplementaresResult> {
  const {
    buscarTimeline = true,
    buscarPartes = true,
    delayEntreRequisicoes = 300,
    onProgress,
    verificarRecaptura = false,
    horasParaRecaptura = 24,
  } = options;

  const porProcesso = new Map<number, DadosComplementaresProcesso>();
  const errosDetalhados: Array<{ processoId: number; tipo: string; erro: string }> = [];

  let timelinesObtidas = 0;
  let partesObtidas = 0;
  let processosPulados = 0;

  // Verificar quais processos precisam ser recapturados
  let processosParaBuscar = processosIds;

  if (verificarRecaptura) {
    console.log(`🔍 [DadosComplementares] Verificando processos atualizados nas últimas ${horasParaRecaptura}h...`);

    const resultado = await verificarProcessosParaRecaptura(processosIds, {
      horasParaRecaptura,
      trt: options.trt,
      grau: options.grau,
    });

    processosParaBuscar = resultado.paraRecapturar;
    processosPulados = resultado.pulados.length;

    if (processosPulados > 0) {
      console.log(`⏭️ [DadosComplementares] ${processosPulados} processos pulados (atualizados recentemente)`);
    }
  }

  console.log(`🔄 [DadosComplementares] Iniciando busca para ${processosParaBuscar.length} processos...`, {
    buscarTimeline,
    buscarPartes,
    delayEntreRequisicoes,
    totalOriginal: processosIds.length,
    processosPulados,
  });

  for (let i = 0; i < processosParaBuscar.length; i++) {
    const processoId = processosParaBuscar[i];

    // Callback de progresso
    if (onProgress) {
      onProgress(i + 1, processosParaBuscar.length, processoId);
    }

    // Log de progresso a cada 10 processos ou no primeiro/último
    if (i === 0 || i === processosParaBuscar.length - 1 || (i + 1) % 10 === 0) {
      console.log(`📊 [DadosComplementares] Progresso: ${i + 1}/${processosParaBuscar.length} processos`);
    }

    const dadosProcesso: DadosComplementaresProcesso = {
      processoId,
      erros: [],
    };

    // Buscar timeline e partes em paralelo (são chamadas independentes)
    const promises: Promise<void>[] = [];

    if (buscarTimeline) {
      promises.push(
        obterTimeline(page, String(processoId), {
          somenteDocumentosAssinados: false,
          buscarMovimentos: true,
          buscarDocumentos: true,
        })
          .then((timeline) => {
            dadosProcesso.timeline = timeline;
            timelinesObtidas++;
          })
          .catch((e) => {
            const erro = e instanceof Error ? e.message : String(e);
            dadosProcesso.erros.push({ tipo: 'timeline', erro });
            errosDetalhados.push({ processoId, tipo: 'timeline', erro });
            console.warn(`⚠️ [DadosComplementares] Erro ao buscar timeline do processo ${processoId}: ${erro}`);
          }),
      );
    }

    if (buscarPartes) {
      promises.push(
        obterPartesProcesso(page, processoId)
          .then((resultado) => {
            dadosProcesso.partes = resultado.partes;
            dadosProcesso.payloadBrutoPartes = resultado.payloadBruto;
            partesObtidas++;
          })
          .catch((e) => {
            const erro = e instanceof Error ? e.message : String(e);
            dadosProcesso.erros.push({ tipo: 'partes', erro });
            errosDetalhados.push({ processoId, tipo: 'partes', erro });
            console.warn(`⚠️ [DadosComplementares] Erro ao buscar partes do processo ${processoId}: ${erro}`);
          }),
      );
    }

    await Promise.all(promises);

    // Um único delay após ambas as chamadas (ao invés de 2x delay)
    if (buscarTimeline || buscarPartes) {
      await delay(delayEntreRequisicoes);
    }

    porProcesso.set(processoId, dadosProcesso);
  }

  const resumo = {
    totalProcessos: processosIds.length,
    processosPulados,
    timelinesObtidas,
    partesObtidas,
    erros: errosDetalhados.length,
  };

  console.log(`✅ [DadosComplementares] Busca concluída:`, resumo);

  return {
    porProcesso,
    resumo,
    errosDetalhados,
  };
}

/**
 * Extrai IDs únicos de processos de uma lista de audiências
 */
export function extrairProcessosUnicos(audiencias: Array<{ idProcesso: number }>): number[] {
  const idsUnicos = [...new Set(audiencias.map(a => a.idProcesso))];
  console.log(`📋 [DadosComplementares] ${idsUnicos.length} processos únicos extraídos de ${audiencias.length} audiências`);
  return idsUnicos;
}

/**
 * Filtra documentos da timeline (exclui movimentos)
 */
export function filtrarDocumentos(timeline: TimelineResponse): TimelineItem[] {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline.filter(item => {
    // Verifica se é documento (não movimento)
    return item.documento === true;
  });
}

