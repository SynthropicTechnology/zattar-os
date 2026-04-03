/**
 * Serviço de processamento em lote de partes
 *
 * Este serviço é responsável por:
 * - Orquestrar processamento paralelo de partes com controle de concorrência
 * - Aplicar retry logic para partes individuais
 * - Executar transações isoladas por parte
 * - Agregar métricas de processamento
 */

import type { PartePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import type { TipoParteClassificacao } from "../types";
import type { ProcessoParaCaptura } from "../partes-capture.service";
import type { AdvogadoIdentificacao } from "../identificacao-partes.service";
import { identificarTipoParte } from "../identificacao-partes.service";
import { validarPartePJE } from "../schemas";
import { CAPTURA_CONFIG } from "../config";
import { PersistenceError } from "../errors";
import { withRetry } from "@/lib/utils/retry";
import getLogger from "@/lib/logger";

// Import serviços especializados
import { processarParte } from "./persistence.service";
import { processarEndereco, vincularEnderecoNaEntidade } from "./addresses.service";
import { criarVinculoProcessoParte } from "./linking.service";
import { processarRepresentantes } from "./representatives.service";

/**
 * Resultado do processamento de uma parte individual
 */
export interface ProcessamentoParteResult {
  tipoParte: TipoParteClassificacao;
  repsCount: number;
  vinculoCriado: boolean;
}

/**
 * Processa partes em lote com controle de concorrência
 * Mantém índice global de ordem para garantir ordenação consistente em processo_partes
 *
 * @param partes - Lista de partes validadas do PJE
 * @param processo - Dados do processo
 * @param advogado - Dados do advogado para identificação de clientes
 * @param logger - Logger para registro de operações
 * @returns Array de resultados (fulfilled ou rejected) para cada parte
 */
export async function processarPartesEmLote(
  partes: PartePJE[],
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<PromiseSettledResult<ProcessamentoParteResult>[]> {
  // Cria pares de (parte, índice global) para manter ordenação
  const partesComIndice = partes.map((parte, indexGlobal) => ({
    parte,
    indexGlobal,
  }));

  // Se paralelização não estiver habilitada, processa sequencialmente
  if (!CAPTURA_CONFIG.ENABLE_PARALLEL_PROCESSING) {
    return await processarSequencialmente(
      partesComIndice,
      processo,
      advogado,
      logger
    );
  }

  // Processa em lotes paralelos com controle de concorrência
  return await processarEmLotesParalelos(
    partesComIndice,
    processo,
    advogado,
    logger
  );
}

/**
 * Processa partes sequencialmente (sem paralelização)
 */
async function processarSequencialmente(
  partesComIndice: Array<{ parte: PartePJE; indexGlobal: number }>,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<PromiseSettledResult<ProcessamentoParteResult>[]> {
  const resultados: PromiseSettledResult<ProcessamentoParteResult>[] = [];

  for (const { parte, indexGlobal } of partesComIndice) {
    try {
      const resultado = await processarParteComRetry(
        parte,
        indexGlobal,
        processo,
        advogado,
        logger
      );
      resultados.push({ status: "fulfilled" as const, value: resultado });
    } catch (error) {
      resultados.push({ status: "rejected" as const, reason: error });
    }
  }

  return resultados;
}

/**
 * Processa partes em lotes paralelos com controle de concorrência
 */
async function processarEmLotesParalelos(
  partesComIndice: Array<{ parte: PartePJE; indexGlobal: number }>,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<PromiseSettledResult<ProcessamentoParteResult>[]> {
  // Divide em lotes para controlar concorrência
  const lotes: Array<Array<{ parte: PartePJE; indexGlobal: number }>> = [];
  for (
    let i = 0;
    i < partesComIndice.length;
    i += CAPTURA_CONFIG.MAX_CONCURRENT_PARTES
  ) {
    lotes.push(
      partesComIndice.slice(i, i + CAPTURA_CONFIG.MAX_CONCURRENT_PARTES)
    );
  }

  const todosResultados: PromiseSettledResult<ProcessamentoParteResult>[] = [];

  for (const lote of lotes) {
    const promises = lote.map(({ parte, indexGlobal }) =>
      processarParteComRetry(parte, indexGlobal, processo, advogado, logger)
    );
    const resultadosLote = await Promise.allSettled(promises);
    todosResultados.push(...resultadosLote);
  }

  return todosResultados;
}

/**
 * Processa uma parte com retry e transação
 *
 * @param parte - Dados da parte do PJE
 * @param index - Índice global da parte (para ordenação)
 * @param processo - Dados do processo
 * @param advogado - Dados do advogado
 * @param logger - Logger
 * @returns Resultado do processamento
 */
async function processarParteComRetry(
  parte: PartePJE,
  index: number,
  processo: ProcessoParaCaptura,
  advogado: AdvogadoIdentificacao,
  logger: ReturnType<typeof getLogger>
): Promise<ProcessamentoParteResult> {
  const processarFn = async () => {
    logger.info(
      { parteIndex: index, parteName: parte.nome },
      "Processando parte"
    );

    // Valida parte
    validarPartePJE(parte);

    // Identifica tipo da parte
    const tipoParte = identificarTipoParte(parte, advogado);

    // Processa com transação
    const { repsCount, vinculoCriado } = await processarParteComTransacao(
      parte,
      tipoParte,
      processo,
      index,
      logger
    );

    return { tipoParte, repsCount, vinculoCriado };
  };

  // Se retry não estiver habilitado, executa diretamente
  if (!CAPTURA_CONFIG.ENABLE_RETRY) {
    return await processarFn();
  }

  return withRetry(processarFn, {
    maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
    baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
    maxDelay: CAPTURA_CONFIG.RETRY_MAX_DELAY_MS,
  });
}

/**
 * Processa uma parte com transação (upsert entidade + vínculo + endereço)
 *
 * @param parte - Dados da parte
 * @param tipoParte - Tipo classificado da parte
 * @param processo - Dados do processo
 * @param ordem - Ordem da parte
 * @param logger - Logger
 * @returns Contagem de representantes e flag de vínculo criado
 */
async function processarParteComTransacao(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura,
  ordem: number,
  logger: ReturnType<typeof getLogger>
): Promise<{ repsCount: number; vinculoCriado: boolean }> {
  // 1. Upsert da entidade
  const resultado = await processarParte(parte, tipoParte, processo);
  if (!resultado) {
    throw new PersistenceError("Falha ao criar entidade", "insert", tipoParte, {
      parte: parte.nome,
    });
  }
  const entidadeId = resultado.id;

  // 2. Processa endereço e vincula
  const enderecoId = await processarEndereco(parte, tipoParte, entidadeId);
  if (enderecoId) {
    await vincularEnderecoNaEntidade(tipoParte, entidadeId, enderecoId);
  }

  // 3. Cria vínculo processo-parte (se processo.id estiver disponível)
  // Se processo.id não estiver no acervo ainda, o vínculo será criado posteriormente
  const vinculoCriado = await criarVinculoProcessoParte(
    processo,
    tipoParte,
    entidadeId,
    parte,
    ordem
  );
  // Nota: vinculoCriado pode ser false se processo.id não está disponível - isso é esperado

  // 4. Processa representantes
  const repsCount = parte.representantes
    ? await processarRepresentantes(
        parte.representantes,
        tipoParte,
        entidadeId,
        processo,
        logger
      )
    : 0;

  return { repsCount, vinculoCriado };
}
