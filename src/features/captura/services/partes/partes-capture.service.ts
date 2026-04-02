/**
 * Serviço principal de captura de partes de processos PJE
 *
 * Este módulo é o orquestrador que:
 * - Coordena busca de partes via API PJE
 * - Delega processamento para serviços especializados
 * - Agrega resultados e métricas
 * - Mantém compatibilidade de API para consumidores externos
 *
 * FUNÇÕES PÚBLICAS:
 * - capturarPartesProcesso: Busca partes no PJE + persistência
 * - persistirPartesProcesso: Apenas persistência (partes já buscadas)
 *
 * CONSUMIDORES:
 * - src/app/api/captura/trt/partes/route.ts
 * - src/features/captura/server.ts
 * - Serviços TRT (dados-complementares.service.ts, etc.)
 */

import type { Page } from "playwright";
import type { PartePJE } from "@/features/captura/pje-trt/partes/types";
import type { CapturaPartesResult } from "./types";
import type { GrauProcesso } from "@/app/app/partes";
import { validarDocumentoAdvogado, type AdvogadoIdentificacao } from "./identificacao-partes.service";
import { validarPartesArray } from "./schemas";
import { CAPTURA_CONFIG } from "./config";
import { extractErrorInfo } from "./errors";
import getLogger, { withCorrelationId } from "@/lib/logger";

// Import serviços especializados
import { buscarPartesPJE } from "./services/fetch.service";
import { processarPartesEmLote } from "./services/processing.service";

// ============================================================================
// Tipos Públicos
// ============================================================================

/**
 * Interface para dados básicos do processo necessários para captura
 *
 * CAMPOS OBRIGATÓRIOS:
 * - id_pje: Usado para buscar partes na API do PJE
 * - trt: Usado para registrar em cadastros_pje
 * - grau: Usado para registrar em cadastros_pje
 *
 * CAMPOS OPCIONAIS:
 * - id: ID na tabela acervo. Se fornecido, cria vínculo processo_partes
 * - numero_processo: Número CNJ. Usado em logs e vínculo (opcional)
 */
export interface ProcessoParaCaptura {
  /** ID interno do processo no PJE (OBRIGATÓRIO) */
  id_pje: number;
  /** TRT do processo (ex: "TRT3", "TRT5") (OBRIGATÓRIO) */
  trt: string;
  /** Grau do processo (OBRIGATÓRIO) */
  grau: GrauProcesso;
  /** ID do processo na tabela acervo (OPCIONAL - se não fornecido, não cria vínculo) */
  id?: number;
  /** Número CNJ do processo (OPCIONAL - usado em logs e vínculo) */
  numero_processo?: string;
}

// ============================================================================
// Funções Públicas
// ============================================================================

/**
 * Captura todas as partes de um processo do PJE
 *
 * FLUXO:
 * 1. Busca partes do processo via API PJE
 * 2. Para cada parte: identifica tipo, persiste, processa endereço e representantes
 * 3. Cria vínculos processo-partes
 * 4. Retorna resultado com contadores
 *
 * TRATAMENTO DE ERROS:
 * - Erros em uma parte não interrompem processamento das demais
 * - Erros são coletados no array de erros do resultado
 *
 * @param page - Página Playwright autenticada no PJE
 * @param processo - Dados do processo
 * @param advogado - Dados do advogado para identificação de clientes
 * @returns Resultado da captura com contadores e erros
 */
export async function capturarPartesProcesso(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao
): Promise<CapturaPartesResult> {
  return withCorrelationId(async () => {
    const logger = getLogger({
      service: "captura-partes",
      processoId: processo.id ?? processo.id_pje,
    });
    return capturarPartesProcessoInternal(page, processo, advogado, logger);
  });
}

/**
 * Persiste partes já buscadas de um processo
 *
 * Diferente de capturarPartesProcesso, esta função NÃO busca na API do PJE.
 * Útil quando partes já foram buscadas em etapa anterior.
 *
 * @param partes - Partes já buscadas do PJE
 * @param processo - Dados do processo
 * @param advogado - Dados do advogado para identificação de clientes
 * @returns Resultado da persistência com contadores e erros
 */
export async function persistirPartesProcesso(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao
): Promise<CapturaPartesResult> {
  return withCorrelationId(async () => {
    const logger = getLogger({
      service: "persistir-partes",
      processoId: processo.id ?? processo.id_pje,
    });
    return persistirPartesProcessoInternal(partes, processo, advogado, logger);
  });
}

// ============================================================================
// Funções Internas
// ============================================================================

/**
 * Implementação interna de captura (busca + persistência)
 */
async function capturarPartesProcessoInternal(
  page: Page,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<CapturaPartesResult> {
  const inicio = performance.now();
  const resultado = criarResultadoInicial(processo);

  const metricas = {
    buscarPartesPJE: 0,
    processarPartes: 0,
  };

  try {
    logger.info(
      { idPje: processo.id_pje, numeroProcesso: processo.numero_processo },
      "Iniciando captura de partes"
    );

    // 1. Valida documento do advogado UMA ÚNICA VEZ
    validarDocumentoAdvogado(advogado);

    // 2. Busca partes via API PJE
    const inicioBuscar = performance.now();
    const { partes, payloadBruto } = await buscarPartesPJE(page, processo.id_pje);
    metricas.buscarPartesPJE = performance.now() - inicioBuscar;

    resultado.totalPartes = partes.length;
    resultado.payloadBruto = payloadBruto as Record<string, unknown> | null;

    logger.info(
      { totalPartes: partes.length, duracaoMs: metricas.buscarPartesPJE },
      "Partes encontradas no PJE"
    );

    // Se não há partes, retorna resultado vazio
    if (partes.length === 0) {
      resultado.duracaoMs = performance.now() - inicio;
      return resultado;
    }

    // 3. Valida schema PJE
    const partesValidadas = validarPartesArray(partes);

    // 4. Processa partes em lote
    const inicioProcessar = performance.now();
    const resultadosProcessamento = await processarPartesEmLote(
      partesValidadas,
      processo,
      advogado,
      logger
    );
    metricas.processarPartes = performance.now() - inicioProcessar;

    // 5. Agrega resultados
    agregarResultados(resultado, resultadosProcessamento, logger);

    resultado.duracaoMs = performance.now() - inicio;

    logger.info({ ...resultado, metricas }, "Captura concluída");

    // Alerta se performance abaixo do esperado
    if (resultado.duracaoMs > CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS) {
      logger.warn(
        { ...resultado, metricas, threshold: CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS },
        "Performance abaixo do esperado"
      );
    }

    return resultado;
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logger.error(errorInfo, "Erro fatal ao capturar partes");
    resultado.duracaoMs = performance.now() - inicio;
    throw error;
  }
}

/**
 * Implementação interna de persistência (sem busca)
 */
async function persistirPartesProcessoInternal(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<CapturaPartesResult> {
  const inicio = performance.now();
  const resultado = criarResultadoInicial(processo);
  resultado.totalPartes = partes.length;

  try {
    logger.info(
      { idPje: processo.id_pje, totalPartes: partes.length },
      "Persistindo partes já buscadas"
    );

    // 1. Valida documento do advogado
    validarDocumentoAdvogado(advogado);

    // 2. Se não há partes, retorna resultado vazio
    if (partes.length === 0) {
      resultado.duracaoMs = performance.now() - inicio;
      return resultado;
    }

    // 3. Valida schema PJE
    const partesValidadas = validarPartesArray(partes);

    // 4. Processa partes em lote
    const resultadosProcessamento = await processarPartesEmLote(
      partesValidadas,
      processo,
      advogado,
      logger
    );

    // 5. Agrega resultados
    agregarResultados(resultado, resultadosProcessamento, logger);

    resultado.duracaoMs = performance.now() - inicio;

    logger.info({ ...resultado }, "Persistência concluída");

    return resultado;
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logger.error(errorInfo, "Erro fatal ao persistir partes");
    resultado.duracaoMs = performance.now() - inicio;
    throw error;
  }
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Cria objeto de resultado inicial com valores zerados
 */
function criarResultadoInicial(processo: ProcessoParaCaptura): CapturaPartesResult {
  return {
    processoId: processo.id ?? processo.id_pje,
    numeroProcesso: processo.numero_processo ?? `PJE:${processo.id_pje}`,
    totalPartes: 0,
    clientes: 0,
    partesContrarias: 0,
    terceiros: 0,
    representantes: 0,
    vinculos: 0,
    erros: [],
    duracaoMs: 0,
    payloadBruto: null,
  };
}

/**
 * Agrega resultados do processamento em lote no resultado final
 */
function agregarResultados(
  resultado: CapturaPartesResult,
  resultadosProcessamento: PromiseSettledResult<{
    tipoParte: "cliente" | "parte_contraria" | "terceiro";
    repsCount: number;
    vinculoCriado: boolean;
  }>[],
  logger: ReturnType<typeof getLogger>
): void {
  for (const res of resultadosProcessamento) {
    if (res.status === "fulfilled") {
      const { tipoParte, repsCount, vinculoCriado } = res.value;
      if (tipoParte === "cliente") resultado.clientes++;
      else if (tipoParte === "parte_contraria") resultado.partesContrarias++;
      else if (tipoParte === "terceiro") resultado.terceiros++;
      resultado.representantes += repsCount;
      if (vinculoCriado) resultado.vinculos++;
    } else {
      const error = res.reason;
      const errorInfo = extractErrorInfo(error);
      logger.error({ error: errorInfo }, "Erro ao processar parte");
      resultado.erros.push({
        parteIndex: -1,
        parteDados: {
          idParte: 0,
          nome: "Desconhecido",
          tipoParte: "DESCONHECIDO",
        },
        erro: errorInfo.message,
      });
    }
  }
}
