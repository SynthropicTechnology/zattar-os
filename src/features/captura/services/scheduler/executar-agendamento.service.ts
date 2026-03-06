// Serviço para executar um agendamento de captura

import type { Agendamento } from '../../types/agendamentos-types';
import { getCredentialComplete } from '../../credentials/credential.service';
import { getTribunalConfig } from '../trt/config';
import { acervoGeralCapture, type AcervoGeralResult } from '../trt/acervo-geral.service';
import { arquivadosCapture, type ArquivadosResult } from '../trt/arquivados.service';
import { audienciasCapture, type AudienciasResult } from '../trt/audiencias.service';
import { pendentesManifestacaoCapture, type PendentesManifestacaoResult } from '../trt/pendentes-manifestacao.service';
import { periciasCapture, type PericiasResult } from '../trt/pericias.service';
import { capturaCombinada, type CapturaCombinAdaResult } from '../trt/captura-combinada.service';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '../captura-log.service';
import { atualizarAgendamento } from '../persistence/agendamento-persistence.service';
import { recalcularProximaExecucaoAposExecucao } from '../agendamentos/calcular-proxima-execucao.service';
import type { FiltroPrazoPendentes, CodigoTRT, GrauTRT } from '../../types/trt-types';
import { registrarCapturaRawLog } from '../persistence/captura-raw-log.service';

/**
 * Parâmetros para salvar payloads brutos de partes como raw logs no Supabase
 */
interface SalvarPayloadsPartesParams {
  payloadsBrutosPartes: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;
  capturaLogId: number | null;
  advogadoId: number;
  credencialId: number;
  credencialIds: number[];
  trt: CodigoTRT;
  grau: GrauTRT;
  tipoCapturaPai: string;
}

/**
 * Salva payloads brutos de partes como logs separados (captura_logs_brutos)
 * Cada processo terá seu próprio documento com tipo_captura: 'partes'
 * Isso permite reprocessamento futuro das partes
 */
async function salvarPayloadsBrutosPartes(params: SalvarPayloadsPartesParams): Promise<number> {
  const { payloadsBrutosPartes, capturaLogId, advogadoId, credencialId, credencialIds, trt, grau, tipoCapturaPai } = params;

  if (!payloadsBrutosPartes || payloadsBrutosPartes.length === 0) {
    return 0;
  }

  if (capturaLogId === null) {
    console.warn(`[Scheduler] ${payloadsBrutosPartes.length} payloads de partes não salvos (logId não disponível)`);
    return 0;
  }

  let salvos = 0;
  for (const { processoId, numeroProcesso, payloadBruto } of payloadsBrutosPartes) {
    // Pular se não há payload
    if (!payloadBruto) continue;

    try {
      await registrarCapturaRawLog({
        captura_log_id: capturaLogId,
        tipo_captura: 'partes', // Tipo separado para identificar logs de partes
        advogado_id: advogadoId,
        credencial_id: credencialId,
        credencial_ids: credencialIds,
        trt,
        grau,
        status: 'success',
        requisicao: {
          processo_id: processoId,
          numero_processo: numeroProcesso,
          captura_pai: tipoCapturaPai, // Referência à captura que originou este log
        },
        payload_bruto: payloadBruto,
        resultado_processado: undefined,
        logs: undefined,
      });
      salvos++;
    } catch (error) {
      console.warn(`⚠️ [Scheduler] Erro ao salvar payload de partes do processo ${processoId}:`, error);
    }
  }

  if (salvos > 0) {
    console.log(`   📦 [Scheduler] ${salvos} payloads de partes salvos como raw logs no Supabase`);
  }

  return salvos;
}

const ORDEM_FILTROS_PENDENTES: FiltroPrazoPendentes[] = ['sem_prazo', 'no_prazo'];

const resolverFiltrosPendentes = (
  filtros?: FiltroPrazoPendentes[] | null,
  filtroUnico?: FiltroPrazoPendentes | null
): FiltroPrazoPendentes[] => {
  const candidatos = filtros && filtros.length ? filtros : (filtroUnico ? [filtroUnico] : []);
  const valores: FiltroPrazoPendentes[] = candidatos.length ? candidatos : ['sem_prazo'];
  const unicos = Array.from(new Set(valores));
  return unicos.sort((a, b) => ORDEM_FILTROS_PENDENTES.indexOf(a) - ORDEM_FILTROS_PENDENTES.indexOf(b));
};

/**
 * Executa um agendamento de captura
 * @param agendamento - Agendamento a ser executado
 * @param atualizarProximaExecucao - Se true, atualiza próxima_execucao após execução (para scheduler automático)
 * @returns ID do log de captura criado
 */
export async function executarAgendamento(
  agendamento: Agendamento,
  atualizarProximaExecucao: boolean = true
): Promise<{ captureId: number | null }> {
  console.log(`[Scheduler] Executando agendamento ID ${agendamento.id}: ${agendamento.tipo_captura} para advogado ${agendamento.advogado_id}`);

  // Buscar credenciais completas
  const credenciaisCompletas = await Promise.all(
    agendamento.credencial_ids.map((id) => getCredentialComplete(id))
  );

  const credenciaisNaoEncontradas = credenciaisCompletas
    .map((cred, index) => (!cred ? agendamento.credencial_ids[index] : null))
    .filter((id): id is number => id !== null);

  if (credenciaisNaoEncontradas.length > 0) {
    throw new Error(`Credenciais não encontradas: ${credenciaisNaoEncontradas.join(', ')}`);
  }

  // Criar registro de histórico (com retry)
  let logId: number | null = null;
  try {
    logId = await iniciarCapturaLog({
      tipo_captura: agendamento.tipo_captura,
      advogado_id: agendamento.advogado_id,
      credencial_ids: agendamento.credencial_ids,
      status: 'in_progress',
    });
  } catch (error) {
    console.error('[Scheduler] Erro ao criar registro de histórico, tentando novamente:', error);
    try {
      logId = await iniciarCapturaLog({
        tipo_captura: agendamento.tipo_captura,
        advogado_id: agendamento.advogado_id,
        credencial_ids: agendamento.credencial_ids,
        status: 'in_progress',
      });
    } catch {
      console.error('[Scheduler] CRÍTICO: Impossível criar registro de log. Raw logs serão pulados nesta execução.');
    }
  }

  // Helper: registrar raw log apenas se logId existe (evita registros com captura_log_id=-1)
  const registrarRawLog = async (params: Omit<Parameters<typeof registrarCapturaRawLog>[0], 'captura_log_id'>) => {
    if (logId === null) {
      console.warn('[Scheduler] Raw log pulado (logId não disponível):', params.tipo_captura, params.status);
      return;
    }
    await registrarCapturaRawLog({ ...params, captura_log_id: logId });
  };

  // Executar captura baseado no tipo
  const executarCaptura = async () => {
    const resultados: Array<{
      credencial_id: number;
      tribunal: string;
      grau: string;
      resultado?: unknown;
      erro?: string;
      filtros?: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }>;
    }> = [];

    for (const credCompleta of credenciaisCompletas) {
      if (!credCompleta) continue;

      let tribunalConfig;
      try {
        tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
      } catch (error) {
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          erro: `Configuração do tribunal não encontrada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
        await registrarRawLog({
          tipo_captura: agendamento.tipo_captura,
          advogado_id: agendamento.advogado_id,
          credencial_id: credCompleta.credentialId,
          credencial_ids: agendamento.credencial_ids,
          trt: credCompleta.tribunal,
          grau: credCompleta.grau,
          status: 'error',
          requisicao: {
            agendamento_id: agendamento.id,
            parametros_extras: agendamento.parametros_extras,
          },
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        continue;
      }

      try {
        let resultado: unknown;

        switch (agendamento.tipo_captura) {
          case 'acervo_geral':
            resultado = await acervoGeralCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });
            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
              },
              payload_bruto: (resultado as AcervoGeralResult).payloadBruto ?? (resultado as AcervoGeralResult).processos,
              resultado_processado: (resultado as AcervoGeralResult).persistencia,
              logs: (resultado as AcervoGeralResult).logs,
            });
            // Salvar payloads brutos de partes como raw logs no Supabase
            if ((resultado as AcervoGeralResult).payloadsBrutosPartes) {
              await salvarPayloadsBrutosPartes({
                payloadsBrutosPartes: (resultado as AcervoGeralResult).payloadsBrutosPartes!,
                capturaLogId: logId,
                advogadoId: agendamento.advogado_id,
                credencialId: credCompleta.credentialId,
                credencialIds: agendamento.credencial_ids,
                trt: credCompleta.tribunal,
                grau: credCompleta.grau,
                tipoCapturaPai: 'acervo_geral',
              });
            }
            break;
          case 'arquivados':
            resultado = await arquivadosCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });
            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
              },
              payload_bruto: (resultado as ArquivadosResult).payloadBruto ?? (resultado as ArquivadosResult).processos,
              resultado_processado: (resultado as ArquivadosResult).persistencia,
              logs: (resultado as ArquivadosResult).logs,
            });
            // Salvar payloads brutos de partes como raw logs no Supabase
            if ((resultado as ArquivadosResult).payloadsBrutosPartes) {
              await salvarPayloadsBrutosPartes({
                payloadsBrutosPartes: (resultado as ArquivadosResult).payloadsBrutosPartes!,
                capturaLogId: logId,
                advogadoId: agendamento.advogado_id,
                credencialId: credCompleta.credentialId,
                credencialIds: agendamento.credencial_ids,
                trt: credCompleta.tribunal,
                grau: credCompleta.grau,
                tipoCapturaPai: 'arquivados',
              });
            }
            break;
          case 'audiencias':
            const paramsAudiencias = agendamento.parametros_extras as { dataInicio?: string; dataFim?: string } | null;
            resultado = await audienciasCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
              dataInicio: paramsAudiencias?.dataInicio,
              dataFim: paramsAudiencias?.dataFim,
            });
            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
                dataInicioSolicitado: paramsAudiencias?.dataInicio,
                dataFimSolicitado: paramsAudiencias?.dataFim,
                dataInicioExecutado: (resultado as AudienciasResult).dataInicio,
                dataFimExecutado: (resultado as AudienciasResult).dataFim,
              },
              payload_bruto: (resultado as AudienciasResult).paginasBrutas ?? (resultado as AudienciasResult).audiencias,
              resultado_processado: (resultado as AudienciasResult).persistencia,
              logs: (resultado as AudienciasResult).logs,
            });
            // Salvar payloads brutos de partes como raw logs no Supabase
            if ((resultado as AudienciasResult).payloadsBrutosPartes) {
              await salvarPayloadsBrutosPartes({
                payloadsBrutosPartes: (resultado as AudienciasResult).payloadsBrutosPartes!,
                capturaLogId: logId,
                advogadoId: agendamento.advogado_id,
                credencialId: credCompleta.credentialId,
                credencialIds: agendamento.credencial_ids,
                trt: credCompleta.tribunal,
                grau: credCompleta.grau,
                tipoCapturaPai: 'audiencias',
              });
            }
            break;
          case 'pendentes': {
            const paramsPendentes = agendamento.parametros_extras as { filtroPrazo?: FiltroPrazoPendentes; filtrosPrazo?: FiltroPrazoPendentes[] } | null;
            const filtrosParaExecutar = resolverFiltrosPendentes(
              paramsPendentes?.filtrosPrazo || null,
              paramsPendentes?.filtroPrazo || null
            );

            const resultadosPendentes: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }> = [];

            for (const filtro of filtrosParaExecutar) {
              try {
                const captura = await pendentesManifestacaoCapture({
                  credential: credCompleta.credenciais,
                  config: tribunalConfig,
                  filtroPrazo: filtro,
                  capturarDocumentos: true,
                });

                resultadosPendentes.push({ filtroPrazo: filtro, resultado: captura });

                await registrarRawLog({
                  tipo_captura: agendamento.tipo_captura,
                  advogado_id: agendamento.advogado_id,
                  credencial_id: credCompleta.credentialId,
                  credencial_ids: agendamento.credencial_ids,
                  trt: credCompleta.tribunal,
                  grau: credCompleta.grau,
                  status: 'success',
                  requisicao: {
                    agendamento_id: agendamento.id,
                    filtroPrazo: filtro,
                    filtrosSolicitados: filtrosParaExecutar,
                  },
                  payload_bruto: (captura as PendentesManifestacaoResult).payloadBruto ?? (captura as PendentesManifestacaoResult).processos,
                  resultado_processado: {
                    persistencia: (captura as PendentesManifestacaoResult).persistencia,
                    documentosCapturados: (captura as PendentesManifestacaoResult).documentosCapturados,
                    documentosFalhados: (captura as PendentesManifestacaoResult).documentosFalhados,
                    errosDocumentos: (captura as PendentesManifestacaoResult).errosDocumentos,
                  },
                  logs: (captura as PendentesManifestacaoResult).logs,
                });
                // Salvar payloads brutos de partes como raw logs no Supabase
                if ((captura as PendentesManifestacaoResult).payloadsBrutosPartes) {
                  await salvarPayloadsBrutosPartes({
                    payloadsBrutosPartes: (captura as PendentesManifestacaoResult).payloadsBrutosPartes!,
                    capturaLogId: logId,
                    advogadoId: agendamento.advogado_id,
                    credencialId: credCompleta.credentialId,
                    credencialIds: agendamento.credencial_ids,
                    trt: credCompleta.tribunal,
                    grau: credCompleta.grau,
                    tipoCapturaPai: 'pendentes',
                  });
                }
              } catch (error) {
                resultadosPendentes.push({
                  filtroPrazo: filtro,
                  erro: error instanceof Error ? error.message : 'Erro desconhecido',
                });

                await registrarRawLog({
                  tipo_captura: agendamento.tipo_captura,
                  advogado_id: agendamento.advogado_id,
                  credencial_id: credCompleta.credentialId,
                  credencial_ids: agendamento.credencial_ids,
                  trt: credCompleta.tribunal,
                  grau: credCompleta.grau,
                  status: 'error',
                  requisicao: {
                    agendamento_id: agendamento.id,
                    filtroPrazo: filtro,
                    filtrosSolicitados: filtrosParaExecutar,
                  },
                  erro: error instanceof Error ? error.message : 'Erro desconhecido',
                });
              }
            }

            resultado = { filtros: resultadosPendentes };
            break;
          }
          case 'pericias': {
            resultado = await periciasCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });

            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
              },
              payload_bruto: (resultado as PericiasResult).pericias,
              resultado_processado: {
                persistencia: (resultado as PericiasResult).persistencia,
                dadosComplementares: (resultado as PericiasResult).dadosComplementares,
              },
              logs: (resultado as PericiasResult).logs,
            });

            // Salvar payloads brutos de partes como raw logs no Supabase
            if ((resultado as PericiasResult).payloadsBrutosPartes) {
              await salvarPayloadsBrutosPartes({
                payloadsBrutosPartes: (resultado as PericiasResult).payloadsBrutosPartes!,
                capturaLogId: logId,
                advogadoId: agendamento.advogado_id,
                credencialId: credCompleta.credentialId,
                credencialIds: agendamento.credencial_ids,
                trt: credCompleta.tribunal,
                grau: credCompleta.grau,
                tipoCapturaPai: 'pericias',
              });
            }
            break;
          }
          case 'combinada': {
            console.log('[Scheduler] Executando captura combinada...');
            resultado = await capturaCombinada({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });

            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
                resumo: (resultado as CapturaCombinAdaResult).resumo,
              },
              payload_bruto: {
                capturas: (resultado as CapturaCombinAdaResult).capturas,
              },
              resultado_processado: {
                persistenciaAudiencias: (resultado as CapturaCombinAdaResult).persistenciaAudiencias,
                persistenciaExpedientes: (resultado as CapturaCombinAdaResult).persistenciaExpedientes,
                dadosComplementares: (resultado as CapturaCombinAdaResult).dadosComplementares,
              },
              logs: (resultado as CapturaCombinAdaResult).logs,
            });

            // Salvar payloads brutos de partes como raw logs no Supabase
            if ((resultado as CapturaCombinAdaResult).payloadsBrutosPartes) {
              await salvarPayloadsBrutosPartes({
                payloadsBrutosPartes: (resultado as CapturaCombinAdaResult).payloadsBrutosPartes!,
                capturaLogId: logId,
                advogadoId: agendamento.advogado_id,
                credencialId: credCompleta.credentialId,
                credencialIds: agendamento.credencial_ids,
                trt: credCompleta.tribunal,
                grau: credCompleta.grau,
                tipoCapturaPai: 'combinada',
              });
            }
            break;
          }
          default:
            throw new Error(`Tipo de captura não suportado: ${agendamento.tipo_captura}`);
        }

        const filtrosResultado = (resultado as { filtros?: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }> } | null)?.filtros;

        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          resultado,
          ...(filtrosResultado ? { filtros: filtrosResultado } : {}),
        });
      } catch (error) {
        console.error(`Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        await registrarRawLog({
          tipo_captura: agendamento.tipo_captura,
          advogado_id: agendamento.advogado_id,
          credencial_id: credCompleta.credentialId,
          credencial_ids: agendamento.credencial_ids,
          trt: credCompleta.tribunal,
          grau: credCompleta.grau,
          status: 'error',
          requisicao: {
            agendamento_id: agendamento.id,
            parametros_extras: agendamento.parametros_extras,
          },
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return resultados;
  };

  // IMPORTANTE: Atualizar proxima_execucao ANTES de executar a captura.
  // Isso evita que o cron (que roda a cada minuto) encontre o mesmo agendamento
  // com proxima_execucao no passado e dispare capturas duplicadas em loop.
  if (atualizarProximaExecucao) {
    try {
      const proximaExecucao = recalcularProximaExecucaoAposExecucao(
        agendamento.periodicidade,
        agendamento.dias_intervalo,
        agendamento.horario
      );
      await atualizarAgendamento(agendamento.id, {
        proxima_execucao: proximaExecucao,
      });
      console.log(`[Scheduler] Agendamento ID ${agendamento.id} - proxima_execucao atualizada para ${proximaExecucao} (antes da execução)`);
    } catch (error) {
      console.error(`[Scheduler] Erro ao atualizar proxima_execucao do agendamento ID ${agendamento.id} antes da execução:`, error);
      // Se não conseguiu atualizar, não executa para evitar loop
      throw error;
    }
  }

  // Executar captura e atualizar histórico (agora com await)
  try {
    const resultados = await executarCaptura();

    if (logId) {
      try {
        const errosColetados = resultados.flatMap((r) => {
          const errosFiltro = r.filtros
            ?.filter((f) => f.erro)
            .map((f) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}) - ${f.filtroPrazo}: ${f.erro}`) || [];

          if (r.erro) {
            return [`${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${r.erro}`, ...errosFiltro];
          }

          return errosFiltro;
        });

        if (errosColetados.length > 0) {
          await finalizarCapturaLogErro(logId, errosColetados);
        } else {
          const filtrosExecutados = Array.from(
            new Set(
              resultados.flatMap((r) => r.filtros?.map((f) => f.filtroPrazo) || [])
            )
          );

          await finalizarCapturaLogSucesso(logId, {
            credenciais_processadas: resultados.length,
            filtros_prazo: filtrosExecutados.length > 0 ? filtrosExecutados : undefined,
            resultados,
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar histórico de captura:', error);
      }
    }

    // Atualizar ultima_execucao após conclusão
    try {
      await atualizarAgendamento(agendamento.id, {
        ultima_execucao: new Date().toISOString(),
      });
      console.log(`[Scheduler] Agendamento ID ${agendamento.id} - ultima_execucao atualizada após conclusão`);
    } catch (error) {
      console.error('Erro ao atualizar ultima_execucao do agendamento:', error);
    }
  } catch (error) {
    console.error('Erro ao executar captura do agendamento:', error);
    if (logId) {
      await finalizarCapturaLogErro(logId, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  return { captureId: logId };
}
