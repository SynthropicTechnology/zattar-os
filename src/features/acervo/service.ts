/**
 * Service Layer for Acervo Feature
 * Business logic orchestration
 */

import {
  listarAcervo as listarAcervoDb,
  listarAcervoAgrupado as listarAcervoAgrupadoDb,
  listarAcervoUnificado as listarAcervoUnificadoDb,
  buscarAcervoPorId,
  atribuirResponsavel as atribuirResponsavelDb,
  buscarProcessosClientePorCpf as buscarProcessosClientePorCpfDb,
} from './repository';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
  ProcessosClienteCpfResponse,
  ProcessoRespostaIA,
  ResumoProcessosIA,
} from './domain';
import {
  formatarCpf,
  agruparProcessosPorNumero,
  formatarTimeline,
  formatarProcessoParaIA,
} from './utils';
import { invalidateAcervoCache } from '@/lib/redis/invalidation';
import { createServiceClient } from '@/lib/supabase/service-client';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';
import { capturarTimeline } from '@/features/captura/server';
import type { CodigoTRT, GrauTRT } from '@/features/captura';
import type { PartePJE } from '@/features/captura/pje-trt/partes/types';
import { autenticarPJE } from '@/features/captura/services/trt/trt-auth.service';
import { getTribunalConfig } from '@/features/captura/services/trt/config';
import { obterPartesProcesso } from '@/features/captura/pje-trt/partes';
import {
  persistirPartesProcesso,
  type ProcessoParaCaptura,
} from '@/features/captura/services/partes/partes-capture.service';
import { getCredentialByTribunalAndGrau } from '@/features/captura/credentials/credential.service';
import { buscarProcessosPorIdsNoPainel } from '@/features/captura/services/trt/buscar-processos-painel.service';

/**
 * Converte data ISO string para timestamptz ou null
 * Assume Brasília (UTC-3) para datas sem timezone explícito
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString);
    if (hasTimezone) return new Date(dateString).toISOString();
    return new Date(dateString + '-03:00').toISOString();
  } catch {
    return null;
  }
}

interface RecaptureResult {
  instanciaId: number;
  trt: string;
  grau: string;
  status: 'ok' | 'erro';
  mensagem?: string;
  totalItens?: number;
  totalDocumentos?: number;
  totalMovimentos?: number;
  partesCapturadas?: number;
  dadosCapaAtualizados?: boolean;
}

/**
 * Extrai nome_parte_autora e nome_parte_re das partes capturadas
 * - nome_parte_autora: primeira parte principal do polo ATIVO
 * - nome_parte_re: primeira parte principal do polo PASSIVO
 */
function extrairNomesPartesDasPartes(partes: PartePJE[]): {
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
} {
  // Separar partes por polo
  const poloAtivo = partes.filter(p => p.polo === 'ATIVO');
  const poloPassivo = partes.filter(p => p.polo === 'PASSIVO');

  // Encontrar a parte principal de cada polo (ou a primeira se não houver principal)
  const parteAutoraFn = (lista: PartePJE[]) =>
    lista.find(p => p.principal) || lista[0];

  const parteAutora = parteAutoraFn(poloAtivo);
  const parteRe = parteAutoraFn(poloPassivo);

  return {
    nome_parte_autora: parteAutora?.nome?.trim() || '',
    qtde_parte_autora: poloAtivo.length || 1,
    nome_parte_re: parteRe?.nome?.trim() || '',
    qtde_parte_re: poloPassivo.length || 1,
  };
}

interface RecaptureResponse {
  numero_processo: string;
  resultados: RecaptureResult[];
  totalSucesso: number;
  totalErro: number;
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Lists acervo with separate instances (no unification)
 * Returns flat array of all process instances
 */
export async function obterAcervoPaginado(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult> {
  return listarAcervoDb({ ...params, unified: false });
}

/**
 * Lists acervo with unified processes (multi-instance grouping)
 * Groups processes with same numero_processo
 */
export async function obterAcervoUnificado(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoUnificadoResult> {
  return listarAcervoUnificadoDb(params);
}

/**
 * Lists acervo with grouping by field
 * Returns aggregated data grouped by specified field
 */
export async function obterAcervoAgrupado(
  params: ListarAcervoParams & { agrupar_por: string }
): Promise<ListarAcervoAgrupadoResult> {
  return listarAcervoAgrupadoDb(params);
}

/**
 * Lists acervo with filters, pagination, and sorting (polymorphic)
 * 
 * @deprecated Use specific methods instead:
 * - obterAcervoPaginado() for flat instances
 * - obterAcervoUnificado() for unified processes
 * - obterAcervoAgrupado() for grouped data
 * 
 * Flow:
 * 1. Validates input parameters
 * 2. Applies search filters, origin, TRT, grade, responsible, etc.
 * 3. Applies pagination
 * 4. Applies sorting
 * 5. Returns paginated list of processes
 * 
 * Unification:
 * - If unified=true (default): Groups processes with same numero_processo
 * - If unified=false: Returns all instances separately
 */
export async function obterAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult | ListarAcervoAgrupadoResult | ListarAcervoUnificadoResult> {
  // If agrupar_por is present, use grouping function
  if (params.agrupar_por) {
    return obterAcervoAgrupado(params as ListarAcervoParams & { agrupar_por: string });
  }

  // If unified=true (or not specified, as it's the default), use unification function
  const unified = params.unified ?? true; // Default: true
  if (unified) {
    return obterAcervoUnificado(params);
  }

  // Otherwise, use default listing function (separate instances)
  return obterAcervoPaginado(params);
}

/**
 * Finds a process by ID
 */
export async function buscarProcessoPorId(id: number) {
  return buscarAcervoPorId(id);
}

/**
 * Assigns responsible user to processes
 * IMPORTANT: Propagates assignment to ALL instances of the same numero_processo
 */
export async function atribuirResponsavel(
  processoIds: number[],
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate process exists
    const supabase = createServiceClient();

    // Optimization: Fetch all IDs in one query to avoid N+1
    const { data: processosEncontrados, error: erroBusca } = await supabase
      .from('acervo')
      .select('id')
      .in('id', processoIds);

    if (erroBusca) {
      return {
        success: false,
        error: erroBusca.message,
      };
    }

    const idsEncontrados = new Set(processosEncontrados?.map((p) => p.id));

    for (const processoId of processoIds) {
      if (!idsEncontrados.has(processoId)) {
        return {
          success: false,
          error: `Processo ${processoId} não encontrado`,
        };
      }
    }

    // Validate responsible exists (if provided)
    if (responsavelId !== null) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', responsavelId)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Responsável não encontrado ou inativo',
        };
      }
    }

    // Validate executing user exists
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', usuarioExecutouId)
      .eq('ativo', true)
      .single();

    if (errorUsuario || !usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado ou inativo',
      };
    }

    // Assign responsible
    await atribuirResponsavelDb(processoIds, responsavelId);

    // Invalidate cache
    await invalidateAcervoCache();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================================================
// CPF-based Process Search (for AI Agent)
// ============================================================================

// ============================================================================
// Internal Types & Constants
// ============================================================================

const MENSAGEM_SINCRONIZANDO =
  'A timeline deste processo está sendo sincronizada. ' +
  'Por favor, aguarde 1-2 minutos e consulte novamente.';

interface ProcessoParaSincronizar {
  processoId: string;
  numeroProcesso: string;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
  advogadoId: number;
}

export function getMensagemSincronizando(): string {
  return MENSAGEM_SINCRONIZANDO;
}

/**
 * Dispara captura de timeline em background (fire-and-forget)
 */
export function sincronizarTimelineEmBackground(
  processos: ProcessoParaSincronizar[]
): void {
  if (processos.length === 0) {
    return;
  }

  console.log(`🔄 [SincronizarTimeline] Disparando captura para ${processos.length} processos em background`);

  const baseUrl = 'http://localhost:3000';
  const serviceApiKey = process.env.SERVICE_API_KEY;

  if (!serviceApiKey) {
    console.warn('❌ [SincronizarTimeline] SERVICE_API_KEY não configurada');
    return;
  }

  for (const processo of processos) {
    const body = {
      trtCodigo: processo.trt,
      grau: processo.grau,
      processoId: processo.processoId,
      numeroProcesso: processo.numeroProcesso,
      advogadoId: processo.advogadoId,
      baixarDocumentos: true,
      filtroDocumentos: {
        apenasAssinados: false,
        apenasNaoSigilosos: false,
      },
    };

    fetch(`${baseUrl}/api/captura/trt/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': serviceApiKey,
      },
      body: JSON.stringify(body),
    }).catch((error) => {
      console.warn(`⚠️ [SincronizarTimeline] Falha ao disparar captura para ${processo.numeroProcesso}:`, error.message);
    });
  }
}

/**
 * Calculates statistical summary of processes
 */
function calcularResumo(processos: ProcessoRespostaIA[]): ResumoProcessosIA {
  let comAudienciaProxima = 0;

  for (const processo of processos) {
    const temAudiencia =
      processo.instancias.primeiro_grau?.proxima_audiencia ||
      processo.instancias.segundo_grau?.proxima_audiencia;
    if (temAudiencia) {
      comAudienciaProxima++;
    }
  }

  return {
    total_processos: processos.length,
    com_audiencia_proxima: comAudienciaProxima,
  };
}

/**
 * Searches for processes by client CPF
 * Returns sanitized and formatted data for AI Agent consumption
 */
export async function buscarProcessosClientePorCpf(
  cpf: string
): Promise<ProcessosClienteCpfResponse> {
  // Normalize CPF (remove punctuation)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    return {
      success: false,
      error: 'CPF inválido. Deve conter 11 dígitos.',
    };
  }

  const cpfLog = (sanitizeForLogs({ cpf: cpfNormalizado }) as { cpf: string }).cpf;
  console.log(`🔍 [BuscarProcessosCpf] Starting search for CPF ${cpfLog}`);

  try {
    // 1. Search processes via Repository
    const { cliente, processos: processosDb } = await buscarProcessosClientePorCpfDb(cpfNormalizado);

    if (!cliente || processosDb.length === 0) {
      console.log('ℹ️ [BuscarProcessosCpf] No processes found');
      return {
        success: false,
        error: 'Nenhum processo encontrado para este CPF.',
      };
    }

    console.log(`✅ [BuscarProcessosCpf] ${processosDb.length} records found in DB`);

    // 1.1 Trigger sync for processes without timeline
    const paraSincronizar: ProcessoParaSincronizar[] = processosDb
      .filter((p) => !p.timeline_jsonb && p.id_pje !== '0')
      .map(p => ({
        processoId: p.id_pje,
        numeroProcesso: p.numero_processo,
        trt: p.trt,
        grau: p.grau,
        advogadoId: p.advogado_id,
      }));

    sincronizarTimelineEmBackground(paraSincronizar);

    // 2. Group by numero_processo
    const processosAgrupados = agruparProcessosPorNumero(processosDb);
    console.log(`📊 [BuscarProcessosCpf] ${processosAgrupados.length} unique processes after grouping`);

    // 3. Format each process for response
    const processosFormatados: ProcessoRespostaIA[] = [];

    const msgSincronizando = getMensagemSincronizando();

    for (const agrupado of processosAgrupados) {
      // Fetch timelines for instances
      const timelinePrimeiroGrau = formatarTimeline(
        agrupado.instancias.primeiro_grau?.timeline_jsonb?.timeline ?? null
      );

      const timelineSegundoGrau = formatarTimeline(
        agrupado.instancias.segundo_grau?.timeline_jsonb?.timeline ?? null
      );

      const temTimelinePrimeiro = timelinePrimeiroGrau.length > 0;
      const temTimelineSegundo = timelineSegundoGrau.length > 0;
      const temTimeline = temTimelinePrimeiro || temTimelineSegundo;

      const taSincronizando = (
        (agrupado.instancias.primeiro_grau && !agrupado.instancias.primeiro_grau.timeline_jsonb) ||
        (agrupado.instancias.segundo_grau && !agrupado.instancias.segundo_grau.timeline_jsonb)
      );

      // Format process
      const processoFormatado = formatarProcessoParaIA(
        agrupado,
        timelinePrimeiroGrau,
        timelineSegundoGrau,
        {
          timelineStatus: temTimeline ? 'disponivel' : 'indisponivel',
          timelineMensagem: (taSincronizando && !temTimeline) ? msgSincronizando : undefined
        }
      );

      processosFormatados.push(processoFormatado);
    }

    // 5. Sort by last movement (most recent first)
    processosFormatados.sort((a, b) => {
      const dataA = a.ultima_movimentacao?.data ?? '01/01/1900';
      const dataB = b.ultima_movimentacao?.data ?? '01/01/1900';

      const parseData = (str: string) => {
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia).getTime();
      };

      return parseData(dataB) - parseData(dataA);
    });

    // 6. Calculate statistical summary
    const resumo = calcularResumo(processosFormatados);

    console.log(`✅ [BuscarProcessosCpf] Response assembled successfully`, {
      cliente: cliente.nome,
      totalProcessos: resumo.total_processos,
      comAudienciaProxima: resumo.com_audiencia_proxima,
    });

    return {
      success: true,
      data: {
        cliente: {
          nome: cliente.nome,
          cpf: formatarCpf(cliente.cpf),
        },
        resumo,
        processos: processosFormatados,
      },
    };

  } catch (error) {
    console.error('❌ [BuscarProcessosCpf] Error in search:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao buscar processos',
    };
  }
}

/**
 * Recaptura a timeline E partes de TODAS as instâncias do processo (1º, 2º e TST),
 * garantindo que a visão unificada fique atualizada.
 *
 * FLUXO:
 * 1. Captura timeline de cada instância (em paralelo)
 * 2. Captura partes de cada instância (em paralelo, após timeline)
 * 3. Atualiza o registro acervo com nome_parte_autora e nome_parte_re
 * 4. Persiste partes e cria vínculos
 */
export async function recapturarTimelineUnificada(acervoId: number): Promise<RecaptureResponse> {
  const supabase = createServiceClient();

  // Buscar número do processo
  const { data: acervo, error: acervoError } = await supabase
    .from('acervo')
    .select('numero_processo')
    .eq('id', acervoId)
    .single();

  if (acervoError || !acervo) {
    throw new Error('Processo não encontrado');
  }

  // Buscar todas as instâncias do mesmo número de processo
  const { data: instancias, error: instanciasError } = await supabase
    .from('acervo')
    .select('id, trt, grau, id_pje, numero_processo, advogado_id')
    .eq('numero_processo', acervo.numero_processo);

  if (instanciasError) {
    throw new Error(`Erro ao buscar instâncias: ${instanciasError.message}`);
  }

  if (!instancias || instancias.length === 0) {
    throw new Error('Nenhuma instância encontrada para o processo');
  }

  // Recapturar instâncias em paralelo
  console.log(`[recapture] Iniciando captura paralela de ${instancias.length} instâncias (timeline + partes)...`);

  const promises = instancias.map(async (inst) => {
    console.log(`[recapture] Processando instância ${inst.grau} (${inst.trt})...`);

    const resultado: RecaptureResult = {
      instanciaId: inst.id,
      trt: inst.trt,
      grau: inst.grau,
      status: 'ok',
    };

    // FASE 1: Capturar Timeline
    try {
      const timelineResult = await capturarTimeline({
        trtCodigo: inst.trt as CodigoTRT,
        grau: inst.grau as GrauTRT,
        processoId: String(inst.id_pje),
        numeroProcesso: inst.numero_processo,
        advogadoId: inst.advogado_id,
        baixarDocumentos: true,
        filtroDocumentos: {
          apenasAssinados: false,
          apenasNaoSigilosos: false,
        },
      });

      console.log(`[recapture] ✅ Timeline ${inst.grau} capturada:`, {
        totalItens: timelineResult.totalItens,
        totalDocumentos: timelineResult.totalDocumentos,
      });

      resultado.totalItens = timelineResult.totalItens;
      resultado.totalDocumentos = timelineResult.totalDocumentos;
      resultado.totalMovimentos = timelineResult.totalMovimentos;
    } catch (error) {
      console.error(`[recapture] ❌ Erro na timeline ${inst.grau}:`, error);
      resultado.status = 'erro';
      resultado.mensagem = error instanceof Error ? error.message : 'Erro desconhecido na timeline';
    }

    // FASE 2: Capturar Partes (mesmo se timeline falhou, tenta capturar partes)
    try {
      console.log(`[recapture] 👥 Capturando partes da instância ${inst.grau} (${inst.trt})...`);

      // Buscar credencial para este TRT/grau
      const credencial = await getCredentialByTribunalAndGrau({
        advogadoId: inst.advogado_id,
        tribunal: inst.trt as CodigoTRT,
        grau: inst.grau as GrauTRT,
      });

      if (!credencial) {
        console.warn(`[recapture] ⚠️ Nenhuma credencial encontrada para ${inst.trt}/${inst.grau}, pulando captura de partes`);
      } else {
        // Buscar configuração do tribunal
        const config = await getTribunalConfig(inst.trt as CodigoTRT, inst.grau as GrauTRT);

        // Autenticar no PJE
        const authResult = await autenticarPJE({
          credential: credencial, // CredenciaisTRT { cpf, senha }
          config,
          headless: true,
        });

        try {
          // Buscar partes do processo
          const { partes } = await obterPartesProcesso(authResult.page, inst.id_pje);

          console.log(`[recapture] ✅ ${partes.length} partes encontradas para ${inst.grau}`);
          resultado.partesCapturadas = partes.length;

          if (partes.length > 0) {
            // Extrair nome_parte_autora e nome_parte_re
            const nomesPartes = extrairNomesPartesDasPartes(partes);

            // Atualizar o registro acervo com os nomes das partes
            const { error: updateError } = await supabase
              .from('acervo')
              .update({
                nome_parte_autora: nomesPartes.nome_parte_autora,
                qtde_parte_autora: nomesPartes.qtde_parte_autora,
                nome_parte_re: nomesPartes.nome_parte_re,
                qtde_parte_re: nomesPartes.qtde_parte_re,
              })
              .eq('id', inst.id);

            if (updateError) {
              console.error(`[recapture] ⚠️ Erro ao atualizar acervo com partes:`, updateError);
            } else {
              console.log(`[recapture] ✅ Acervo atualizado:`, {
                nome_parte_autora: nomesPartes.nome_parte_autora.substring(0, 30) + '...',
                nome_parte_re: nomesPartes.nome_parte_re.substring(0, 30) + '...',
              });
            }

            // Buscar advogado para identificação de clientes
            const { data: advogado } = await supabase
              .from('advogados')
              .select('id, cpf, nome')
              .eq('id', inst.advogado_id)
              .single();

            if (advogado) {
              // Persistir partes e criar vínculos
              const processoParaCaptura: ProcessoParaCaptura = {
                id_pje: inst.id_pje,
                trt: inst.trt,
                grau: inst.grau as 'primeiro_grau' | 'segundo_grau',
                id: inst.id,
                numero_processo: inst.numero_processo,
              };

              await persistirPartesProcesso(
                partes,
                processoParaCaptura,
                {
                  id: advogado.id,
                  documento: advogado.cpf,
                  nome: advogado.nome,
                }
              );

              console.log(`[recapture] ✅ Partes persistidas e vínculos criados`);
            }
          }

          // FASE 3: Buscar e atualizar dados de capa do painel PJE
          try {
            const idAdvogado = parseInt(authResult.advogadoInfo.idAdvogado, 10);
            if (!isNaN(idAdvogado)) {
              console.log(`[recapture] 📋 Buscando dados de capa no painel PJE para ${inst.grau} (${inst.trt})...`);

              const { processosPorOrigem } = await buscarProcessosPorIdsNoPainel(
                authResult.page,
                { idAdvogado, processosIds: [inst.id_pje] }
              );

              const processoAtualizado =
                processosPorOrigem.acervo_geral.find(p => p.id === inst.id_pje) ||
                processosPorOrigem.arquivado.find(p => p.id === inst.id_pje);

              if (processoAtualizado) {
                const classeJudicial = processoAtualizado.classeJudicial
                  ? processoAtualizado.classeJudicial.trim()
                  : 'Não informada';

                const { error: updateCapaError } = await supabase
                  .from('acervo')
                  .update({
                    classe_judicial: classeJudicial,
                    descricao_orgao_julgador: processoAtualizado.descricaoOrgaoJulgador?.trim() || '',
                    codigo_status_processo: processoAtualizado.codigoStatusProcesso?.trim() || '',
                    data_autuacao: parseDate(processoAtualizado.dataAutuacao),
                    segredo_justica: processoAtualizado.segredoDeJustica ?? false,
                    prioridade_processual: processoAtualizado.prioridadeProcessual ?? 0,
                    juizo_digital: processoAtualizado.juizoDigital ?? false,
                    data_arquivamento: parseDate(processoAtualizado.dataArquivamento),
                    data_proxima_audiencia: parseDate(processoAtualizado.dataProximaAudiencia),
                    tem_associacao: processoAtualizado.temAssociacao ?? false,
                  })
                  .eq('id', inst.id);

                if (updateCapaError) {
                  console.error(`[recapture] ⚠️ Erro ao atualizar dados de capa:`, updateCapaError);
                } else {
                  resultado.dadosCapaAtualizados = true;
                  console.log(`[recapture] ✅ Dados de capa atualizados para ${inst.grau}: classe=${classeJudicial}`);
                }
              } else {
                console.warn(`[recapture] ⚠️ Processo ${inst.id_pje} não encontrado no painel PJE`);
              }
            }
          } catch (capaError) {
            console.warn(`[recapture] ⚠️ Erro ao buscar dados de capa (não-fatal):`, capaError);
          }
        } finally {
          // Sempre fechar o browser
          if (authResult.browser) {
            await authResult.browser.close();
          }
        }
      }
    } catch (error) {
      console.error(`[recapture] ⚠️ Erro ao capturar partes ${inst.grau}:`, error);
      // Não marca como erro total - partes são secundárias
      if (resultado.mensagem) {
        resultado.mensagem += ` | Partes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      }
    }

    return resultado;
  });

  const resultados = await Promise.all(promises);

  const totalSucesso = resultados.filter(r => r.status === 'ok').length;
  const totalErro = resultados.length - totalSucesso;

  console.log(`[recapture] ✅ Recaptura finalizada: ${totalSucesso} sucesso, ${totalErro} erro`);

  return {
    numero_processo: acervo.numero_processo,
    resultados,
    totalSucesso,
    totalErro,
  };
}
