// Serviço auxiliar para gerenciar histórico de capturas
// Facilita o registro e atualização de capturas no histórico

import {
  criarCapturaLog,
  atualizarCapturaLog as updateCapturaLog,
} from './persistence/captura-log-persistence.service';
import { captureLogService } from './persistence/capture-log.service';

// Re-export for convenience
export { updateCapturaLog as atualizarCapturaLog };
import type {
  StatusCaptura,
  CriarCapturaLogParams,
} from '../types';

/**
 * Criar registro de captura e retornar ID
 */
export async function iniciarCapturaLog(
  params: CriarCapturaLogParams
): Promise<number> {
  const log = await criarCapturaLog({
    ...params,
    status: params.status || 'in_progress',
  });
  return log.id;
}

/**
 * Atualizar registro de captura com resultado de sucesso.
 * Inclui automaticamente os logs detalhados acumulados pelo captureLogService.
 */
export async function finalizarCapturaLogSucesso(
  logId: number,
  resultado: Record<string, unknown>
): Promise<void> {
  // Consumir logs in-memory e incluir no resultado persistido
  const logsDetalhados = captureLogService.consumirLogs();
  const estatisticas = captureLogService.getEstatisticas();

  await updateCapturaLog(logId, {
    status: 'completed',
    resultado: {
      ...resultado,
      _logs_detalhados: logsDetalhados.length > 0 ? logsDetalhados : undefined,
      _logs_estatisticas: logsDetalhados.length > 0 ? estatisticas : undefined,
    },
    concluido_em: new Date().toISOString(),
  });
}

/**
 * Atualizar registro de captura com erro.
 * Inclui logs detalhados acumulados e aceita erros como string ou array.
 */
export async function finalizarCapturaLogErro(
  logId: number,
  erro: string | string[]
): Promise<void> {
  // Consumir logs in-memory para não vazarem entre capturas
  const logsDetalhados = captureLogService.consumirLogs();

  await updateCapturaLog(logId, {
    status: 'failed',
    erro: Array.isArray(erro) ? erro.join('; ') : erro,
    resultado: {
      _erros: Array.isArray(erro) ? erro : undefined,
      _logs_detalhados: logsDetalhados.length > 0 ? logsDetalhados : undefined,
    },
    concluido_em: new Date().toISOString(),
  });
}

/**
 * Atualizar status de captura
 */
export async function atualizarStatusCapturaLog(
  logId: number,
  status: StatusCaptura
): Promise<void> {
  await updateCapturaLog(logId, {
    status,
  });
}

