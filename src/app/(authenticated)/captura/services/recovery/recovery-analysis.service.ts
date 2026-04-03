/**
 * Serviço de Análise de Recuperação
 *
 * PROPÓSITO:
 * Analisa logs brutos de captura e identifica gaps (elementos faltantes)
 * comparando com os dados persistidos no PostgreSQL.
 */

import type { CapturaRawLog } from '@/app/(authenticated)/captura/types/captura-raw-log';
import type { EntidadeTipoEndereco } from '@/app/(authenticated)/enderecos/types';
import { createServiceClient } from '@/lib/supabase/service-client';
import { buscarLogPorRawLogId } from './captura-recovery.service';
import type { TipoCaptura } from '../../domain';
import type {
  AnaliseCaptura,
  ElementoRecuperavel,
  GapsAnalise,
  TotaisAnalise,
  ProcessoRecovery,
  PartePJEPayload,
  RepresentantePJEPayload,
  EnderecoPJEPayload,
  TipoEntidadeRecuperavel,
  PendentePayload,
  AudienciaPayload,
  AnaliseAgregadaParams,
  AnaliseAgregadaResult,
} from './types';

// ============================================================================
// Funções de Análise Individual
// ============================================================================

/**
 * Analisa um log bruto e identifica gaps de persistência
 *
 * @param rawLogId - ID do log bruto
 * @returns Análise completa com gaps identificados
 */
export async function analisarCaptura(rawLogId: string): Promise<AnaliseCaptura | null> {
  const documento = await buscarLogPorRawLogId(rawLogId);

  if (!documento) {
    return null;
  }

  return analisarDocumento(documento);
}

/**
 * Analisa um log bruto já carregado
 *
 * @param documento - Registro do log bruto
 * @returns Análise completa com gaps identificados
 */
export async function analisarDocumento(
  documento: CapturaRawLog
): Promise<AnaliseCaptura> {
  const rawLogId = (documento as any).raw_log_id as string;

  // Extrair informações do processo
  const processo = extrairInfoProcesso(documento);

  // Verificar se payload está disponível
  const payloadDisponivel =
    (documento as any).payload_bruto !== null && (documento as any).payload_bruto !== undefined;

  // Se não tem payload, retornar análise sem gaps
  if (!payloadDisponivel) {
    return {
      rawLogId,
      capturaLogId: (documento as any).captura_log_id,
      tipoCaptura: (documento as any).tipo_captura,
      dataCaptura: new Date((documento as any).criado_em),
      status: (documento as any).status,
      processo,
      totais: {
        partes: 0,
        partesPersistidas: 0,
        enderecosEsperados: 0,
        enderecosPersistidos: 0,
        representantes: 0,
        representantesPersistidos: 0,
      },
      gaps: {
        enderecosFaltantes: [],
        partesFaltantes: [],
        representantesFaltantes: [],
      },
      payloadDisponivel: false,
      erroOriginal: ((documento as any).erro as string | null | undefined) ?? null,
    };
  }

  // Extrair partes do payload
  const partes = extrairPartesDoPayload((documento as any).payload_bruto);

  // Calcular totais e identificar gaps
  const { totais, gaps } = await identificarGaps(partes, processo);

  return {
    rawLogId,
    capturaLogId: (documento as any).captura_log_id,
    tipoCaptura: (documento as any).tipo_captura,
    dataCaptura: new Date((documento as any).criado_em),
    status: (documento as any).status,
    processo,
    totais,
    gaps,
    payloadDisponivel: true,
    erroOriginal: ((documento as any).erro as string | null | undefined) ?? null,
  };
}

// ============================================================================
// Funções de Extração de Dados
// ============================================================================

/**
 * Extrai informações do processo do documento
 */
function extrairInfoProcesso(documento: CapturaRawLog): ProcessoRecovery {
  const requisicao = (documento as any).requisicao as Record<string, unknown> | undefined;
  const resultadoProcessado = (documento as any).resultado_processado as Record<string, unknown> | undefined;

  return {
    id: (resultadoProcessado?.processoId as number) ?? null,
    idPje: (requisicao?.processo_id_pje as number) ?? (requisicao?.id_pje as number) ?? 0,
    numeroProcesso:
      (requisicao?.numero_processo as string) ??
      (resultadoProcessado?.numeroProcesso as string) ??
      'N/A',
    trt: (documento as any).trt,
    grau: (documento as any).grau,
  };
}

/**
 * Extrai partes do payload bruto
 *
 * O payload pode ter diferentes estruturas dependendo do tipo de captura:
 * - Captura de partes PJE: { ATIVO: [...], PASSIVO: [...] }
 * - Captura de partes array: payload diretamente é array
 * - Outras estruturas: payload.partes[], payload.data[], etc.
 */
function extrairPartesDoPayload(payload: unknown): PartePJEPayload[] {
  if (!payload) {
    return [];
  }

  // Se payload é array, assume que são as partes diretamente
  if (Array.isArray(payload)) {
    return payload as PartePJEPayload[];
  }

  // Se é objeto, tentar extrair de campos conhecidos
  const payloadObj = payload as Record<string, unknown>;

  // ESTRUTURA PJE: { ATIVO: [...], PASSIVO: [...] }
  // Esta é a estrutura padrão retornada pelo PJE para capturas de partes
  if (payloadObj.ATIVO || payloadObj.PASSIVO) {
    const ativos = Array.isArray(payloadObj.ATIVO) ? payloadObj.ATIVO : [];
    const passivos = Array.isArray(payloadObj.PASSIVO) ? payloadObj.PASSIVO : [];
    return [...ativos, ...passivos] as PartePJEPayload[];
  }

  // Tentar campo 'partes'
  if (Array.isArray(payloadObj.partes)) {
    return payloadObj.partes as PartePJEPayload[];
  }

  // Tentar campo 'data' (algumas APIs retornam assim)
  if (payloadObj.data && Array.isArray(payloadObj.data)) {
    return payloadObj.data as PartePJEPayload[];
  }

  // Tentar campo 'content'
  if (payloadObj.content && Array.isArray(payloadObj.content)) {
    return payloadObj.content as PartePJEPayload[];
  }

  return [];
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Extrai o documento (CPF/CNPJ) de uma parte do payload PJE
 * O PJE pode ter o documento em diferentes campos
 */
function extrairDocumentoParte(parte: PartePJEPayload): string | null {
  // Tentar os diversos campos possíveis
  const doc = parte.documento || parte.numeroDocumento || parte.cpf || parte.cnpj;
  return doc || null;
}

/**
 * Extrai o documento de um representante
 */
function extrairDocumentoRepresentante(rep: RepresentantePJEPayload): string | null {
  return rep.documento || rep.numeroDocumento || rep.cpf || null;
}

/**
 * Extrai o endereço de uma parte (pode estar em campos diferentes)
 */
function extrairEnderecoParte(parte: PartePJEPayload): EnderecoPJEPayload | null {
  return parte.endereco || parte.dadosCompletos?.endereco || null;
}

/**
 * Extrai o endereço de um representante
 */
function extrairEnderecoRepresentante(rep: RepresentantePJEPayload): EnderecoPJEPayload | null {
  return rep.endereco || rep.dadosCompletos?.endereco || null;
}

// ============================================================================
// Funções de Identificação de Gaps
// ============================================================================

/**
 * Identifica gaps entre payload e banco de dados
 */
async function identificarGaps(
  partes: PartePJEPayload[],
  _processo: ProcessoRecovery
): Promise<{ totais: TotaisAnalise; gaps: GapsAnalise }> {
  const totais: TotaisAnalise = {
    partes: partes.length,
    partesPersistidas: 0,
    enderecosEsperados: 0,
    enderecosPersistidos: 0,
    representantes: 0,
    representantesPersistidos: 0,
  };

  const gaps: GapsAnalise = {
    enderecosFaltantes: [],
    partesFaltantes: [],
    representantesFaltantes: [],
  };

  const supabase = createServiceClient();

  for (const parte of partes) {
    const documentoParte = extrairDocumentoParte(parte);
    if (!documentoParte) {
      continue;
    }

    // Identificar tipo de entidade baseado no polo
    const entidadeTipo = identificarTipoEntidade(parte);

    // Verificar se parte existe no banco
    const entidadeInfo = await buscarEntidadePorDocumento(
      supabase,
      entidadeTipo,
      documentoParte
    );

    // Extrair endereço da parte
    const enderecoParte = extrairEnderecoParte(parte);

    if (entidadeInfo) {
      totais.partesPersistidas++;

      // Verificar endereço se a parte tem endereço no payload
      if (enderecoParte) {
        totais.enderecosEsperados++;
        const enderecoExiste = await verificarEnderecoExiste(
          supabase,
          entidadeTipo,
          entidadeInfo.id,
          enderecoParte
        );

        if (enderecoExiste) {
          totais.enderecosPersistidos++;
        } else {
          // Gap de endereço identificado
          gaps.enderecosFaltantes.push({
            tipo: 'endereco',
            identificador: String(enderecoParte.id ?? documentoParte),
            nome: `Endereço de ${parte.nome}`,
            dadosBrutos: enderecoParte as unknown as Record<string, unknown>,
            statusPersistencia: 'faltando',
            contexto: {
              entidadeId: entidadeInfo.id,
              entidadeTipo,
            },
          });
        }
      }

      // Verificar representantes
      if (parte.representantes && Array.isArray(parte.representantes)) {
        totais.representantes += parte.representantes.length;

        for (const rep of parte.representantes) {
          const documentoRep = extrairDocumentoRepresentante(rep);
          if (!documentoRep) continue;

          const repExiste = await verificarRepresentanteExiste(supabase, documentoRep);
          if (repExiste) {
            totais.representantesPersistidos++;
          } else {
            gaps.representantesFaltantes.push({
              tipo: 'representante',
              identificador: documentoRep,
              nome: rep.nome ?? 'Representante',
              dadosBrutos: rep as unknown as Record<string, unknown>,
              statusPersistencia: 'faltando',
              contexto: {
                entidadeId: entidadeInfo.id,
                entidadeTipo,
              },
            });
          }
        }
      }
    } else {
      // Parte não existe no banco
      gaps.partesFaltantes.push({
        tipo: 'parte',
        identificador: documentoParte,
        nome: parte.nome ?? 'Parte',
        dadosBrutos: parte as unknown as Record<string, unknown>,
        statusPersistencia: 'faltando',
      });

      // Se parte não existe, endereços também estão faltando
      if (enderecoParte) {
        totais.enderecosEsperados++;
        gaps.enderecosFaltantes.push({
          tipo: 'endereco',
          identificador: String(enderecoParte.id ?? documentoParte),
          nome: `Endereço de ${parte.nome}`,
          dadosBrutos: enderecoParte as unknown as Record<string, unknown>,
          statusPersistencia: 'faltando',
          erro: 'Parte principal não existe no banco',
        });
      }
    }
  }

  return { totais, gaps };
}

/**
 * Identifica o tipo de entidade baseado no polo da parte
 *
 * O PJE retorna polo como "ativo" ou "passivo" (minúsculo)
 * E tipo como "AUTOR", "REU", "ADVOGADO", etc.
 */
function identificarTipoEntidade(parte: PartePJEPayload): EntidadeTipoEndereco {
  const polo = parte.polo?.toLowerCase();
  const tipo = parte.tipo?.toUpperCase();
  const tipoDescricao = parte.tipoParte?.descricao?.toUpperCase();

  // Se for polo ativo (autor/reclamante), geralmente é cliente
  if (polo === 'ativo' || polo === 'at') {
    return 'cliente';
  }

  // Se for polo passivo (réu/reclamado), geralmente é parte contrária
  if (polo === 'passivo' || polo === 'pa') {
    return 'parte_contraria';
  }

  // Verificar por tipo de parte
  if (tipo) {
    if (tipo === 'AUTOR' || tipo === 'RECLAMANTE') {
      return 'cliente';
    }
    if (tipo === 'REU' || tipo === 'RECLAMADO') {
      return 'parte_contraria';
    }
    if (tipo.includes('PERITO') || tipo.includes('TESTEMUNHA') || tipo.includes('MINISTÉRIO')) {
      return 'terceiro';
    }
  }

  // Verificar pela descrição do tipo de parte (legado)
  if (tipoDescricao) {
    if (tipoDescricao.includes('PERITO') || tipoDescricao.includes('TESTEMUNHA') || tipoDescricao.includes('MINISTÉRIO')) {
      return 'terceiro';
    }
  }

  // Default: parte_contraria
  return 'parte_contraria';
}

/**
 * Busca entidade por documento (CPF/CNPJ)
 */
async function buscarEntidadePorDocumento(
  supabase: ReturnType<typeof createServiceClient>,
  tipo: EntidadeTipoEndereco,
  documento: string
): Promise<{ id: number } | null> {
  const documentoLimpo = documento.replace(/\D/g, '');
  const isCpf = documentoLimpo.length === 11;
  const campo = isCpf ? 'cpf' : 'cnpj';

  let tabela: string;
  switch (tipo) {
    case 'cliente':
      tabela = 'clientes';
      break;
    case 'parte_contraria':
      tabela = 'partes_contrarias';
      break;
    case 'terceiro':
      tabela = 'terceiros';
      break;
    default:
      return null;
  }

  const { data, error } = await supabase
    .from(tabela)
    .select('id')
    .eq(campo, documentoLimpo)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id };
}

/**
 * Verifica se endereço existe para uma entidade
 */
async function verificarEnderecoExiste(
  supabase: ReturnType<typeof createServiceClient>,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoPJE: EnderecoPJEPayload
): Promise<boolean> {
  // Primeiro tenta buscar por id_pje se disponível
  if (enderecoPJE.id) {
    const { data } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id_pje', enderecoPJE.id)
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .maybeSingle();

    if (data) {
      return true;
    }
  }

  // Se não tem id_pje ou não encontrou, buscar por entidade
  const { data } = await supabase
    .from('enderecos')
    .select('id')
    .eq('entidade_tipo', entidadeTipo)
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  return !!data;
}

/**
 * Verifica se representante existe por CPF
 */
async function verificarRepresentanteExiste(
  supabase: ReturnType<typeof createServiceClient>,
  documento: string
): Promise<boolean> {
  const documentoLimpo = documento.replace(/\D/g, '');

  const { data } = await supabase
    .from('representantes')
    .select('id')
    .eq('cpf', documentoLimpo)
    .maybeSingle();

  return !!data;
}

// ============================================================================
// Funções de Análise Agregada
// ============================================================================

/**
 * Realiza análise agregada de gaps em múltiplos logs
 */
export async function analisarGapsAgregado(
  params: AnaliseAgregadaParams
): Promise<AnaliseAgregadaResult> {
  const supabase = createServiceClient();

  let query: any = supabase
    .from('captura_logs_brutos')
    .select('*')
    .eq('status', 'success')
    .not('payload_bruto', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(1000);

  if (params.capturaLogId) query = query.eq('captura_log_id', params.capturaLogId);
  if (params.tipoCaptura) query = query.eq('tipo_captura', params.tipoCaptura);
  if (params.trt) query = query.eq('trt', params.trt);
  if (params.grau) query = query.eq('grau', params.grau);
  if (params.dataInicio) query = query.gte('criado_em', new Date(params.dataInicio).toISOString());
  if (params.dataFim) query = query.lte('criado_em', new Date(params.dataFim).toISOString());

  const { data: documentos, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const totalLogs = (documentos ?? []).length;
  let logsComGaps = 0;
  const resumoGaps = { enderecos: 0, partes: 0, representantes: 0 };
  const processosGaps: Map<string, { trt: string; gaps: number }> = new Map();
  const trtStats: Map<string, { total: number; gaps: number }> = new Map();

  for (const doc of documentos ?? []) {
    const analise = await analisarDocumento(doc as CapturaRawLog);

    const totalGapsDoc =
      analise.gaps.enderecosFaltantes.length +
      analise.gaps.partesFaltantes.length +
      analise.gaps.representantesFaltantes.length;

    // Atualizar estatísticas de TRT
    const trtKey = analise.processo.trt;
    const trtStat = trtStats.get(trtKey) || { total: 0, gaps: 0 };
    trtStat.total++;
    trtStat.gaps += totalGapsDoc;
    trtStats.set(trtKey, trtStat);

    if (totalGapsDoc > 0) {
      logsComGaps++;
      resumoGaps.enderecos += analise.gaps.enderecosFaltantes.length;
      resumoGaps.partes += analise.gaps.partesFaltantes.length;
      resumoGaps.representantes += analise.gaps.representantesFaltantes.length;

      // Registrar processo com gaps
      const processoKey = analise.processo.numeroProcesso;
      const processoStat = processosGaps.get(processoKey) || { trt: trtKey, gaps: 0 };
      processoStat.gaps += totalGapsDoc;
      processosGaps.set(processoKey, processoStat);
    }
  }

  // Top processos com gaps
  const topProcessosComGaps = Array.from(processosGaps.entries())
    .map(([numeroProcesso, stat]) => ({
      numeroProcesso,
      trt: stat.trt,
      totalGaps: stat.gaps,
    }))
    .sort((a, b) => b.totalGaps - a.totalGaps)
    .slice(0, 10);

  // Distribuição por TRT
  const distribuicaoPorTrt = Array.from(trtStats.entries())
    .map(([trt, stat]) => ({
      trt,
      totalLogs: stat.total,
      totalGaps: stat.gaps,
    }))
    .sort((a, b) => a.trt.localeCompare(b.trt));

  return {
    totalLogs,
    logsComGaps,
    resumoGaps,
    topProcessosComGaps,
    distribuicaoPorTrt,
  };
}

/**
 * Verifica rapidamente se um log possui gaps (sem análise completa)
 */
export async function verificarSeLogPossuiGaps(rawLogId: string): Promise<boolean> {
  const analise = await analisarCaptura(rawLogId);
  if (!analise) return false;

  return (
    analise.gaps.enderecosFaltantes.length > 0 ||
    analise.gaps.partesFaltantes.length > 0 ||
    analise.gaps.representantesFaltantes.length > 0
  );
}

// ============================================================================
// Extração de Todos os Elementos
// ============================================================================

/**
 * Resultado da extração de todos os elementos
 */
export interface TodosElementosResult {
  partes: ElementoRecuperavel[];
  enderecos: ElementoRecuperavel[];
  representantes: ElementoRecuperavel[];
  totais: {
    partes: number;
    partesExistentes: number;
    partesFaltantes: number;
    enderecos: number;
    enderecosExistentes: number;
    enderecosFaltantes: number;
    representantes: number;
    representantesExistentes: number;
    representantesFaltantes: number;
  };
}

/**
 * Extrai TODOS os elementos do payload (não apenas gaps)
 * Verifica o status de persistência de cada um no PostgreSQL
 *
 * @param rawLogId - ID do log bruto
 * @returns Todos os elementos com status de persistência
 */
export async function extrairTodosElementos(
  rawLogId: string
): Promise<TodosElementosResult | null> {
  const documento = await buscarLogPorRawLogId(rawLogId);

  if (!documento || !(documento as any).payload_bruto) {
    return null;
  }

  const supabase = createServiceClient();
  const partes = extrairPartesDoPayload((documento as any).payload_bruto);

  const elementosPartes: ElementoRecuperavel[] = [];
  const elementosEnderecos: ElementoRecuperavel[] = [];
  const elementosRepresentantes: ElementoRecuperavel[] = [];

  const totais = {
    partes: 0,
    partesExistentes: 0,
    partesFaltantes: 0,
    enderecos: 0,
    enderecosExistentes: 0,
    enderecosFaltantes: 0,
    representantes: 0,
    representantesExistentes: 0,
    representantesFaltantes: 0,
  };

  for (const parte of partes) {
    const documentoParte = extrairDocumentoParte(parte);
    if (!documentoParte) {
      continue;
    }

    totais.partes++;

    // Identificar tipo de entidade baseado no polo
    const entidadeTipo = identificarTipoEntidade(parte);

    // Verificar se parte existe no banco
    const entidadeInfo = await buscarEntidadePorDocumento(
      supabase,
      entidadeTipo,
      documentoParte
    );

    const parteExiste = !!entidadeInfo;

    if (parteExiste) {
      totais.partesExistentes++;
    } else {
      totais.partesFaltantes++;
    }

    // Adicionar parte à lista
    elementosPartes.push({
      tipo: 'parte',
      identificador: documentoParte,
      nome: parte.nome ?? 'Parte sem nome',
      dadosBrutos: parte as unknown as Record<string, unknown>,
      statusPersistencia: parteExiste ? 'existente' : 'faltando',
      contexto: {
        entidadeId: entidadeInfo?.id,
        entidadeTipo,
      },
    });

    // Processar endereço se a parte tem endereço no payload
    const enderecoParte = extrairEnderecoParte(parte);
    if (enderecoParte) {
      totais.enderecos++;

      let enderecoExiste = false;
      let enderecoId: number | undefined;

      if (entidadeInfo) {
        const enderecoInfo = await buscarEnderecoExistente(
          supabase,
          entidadeTipo,
          entidadeInfo.id,
          enderecoParte
        );
        enderecoExiste = !!enderecoInfo;
        enderecoId = enderecoInfo?.id;
      }

      if (enderecoExiste) {
        totais.enderecosExistentes++;
      } else {
        totais.enderecosFaltantes++;
      }

      elementosEnderecos.push({
        tipo: 'endereco',
        identificador: String(enderecoParte.id ?? documentoParte),
        nome: `Endereço de ${parte.nome ?? documentoParte}`,
        dadosBrutos: enderecoParte as unknown as Record<string, unknown>,
        statusPersistencia: enderecoExiste ? 'existente' : 'faltando',
        contexto: {
          entidadeId: entidadeInfo?.id,
          entidadeTipo,
          enderecoId,
        },
        erro: !entidadeInfo ? 'Parte principal não existe no banco' : undefined,
      });
    }

    // Processar representantes
    if (parte.representantes && Array.isArray(parte.representantes)) {
      for (const rep of parte.representantes) {
        const documentoRep = extrairDocumentoRepresentante(rep);
        if (!documentoRep) continue;

        totais.representantes++;

        const repInfo = await buscarRepresentanteExistente(supabase, documentoRep);
        const repExiste = !!repInfo;

        if (repExiste) {
          totais.representantesExistentes++;
        } else {
          totais.representantesFaltantes++;
        }

        elementosRepresentantes.push({
          tipo: 'representante',
          identificador: documentoRep,
          nome: rep.nome ?? 'Representante sem nome',
          dadosBrutos: rep as unknown as Record<string, unknown>,
          statusPersistencia: repExiste ? 'existente' : 'faltando',
          contexto: {
            entidadeId: repInfo?.id ?? entidadeInfo?.id,
            entidadeTipo,
          },
          erro: !repExiste ? 'Representante não cadastrado no banco de dados (CPF não encontrado na tabela representantes)' : undefined,
        });

        // Endereço do representante
        const enderecoRep = extrairEnderecoRepresentante(rep);
        if (enderecoRep) {
          totais.enderecos++;

          // Verificar se endereço do representante existe
          // Para representantes, usamos tipo 'representante' se existir na tabela
          let enderecoRepExiste = false;

          if (repInfo) {
            const enderecoRepInfo = await supabase
              .from('enderecos')
              .select('id')
              .eq('entidade_tipo', 'representante')
              .eq('entidade_id', repInfo.id)
              .eq('ativo', true)
              .maybeSingle();

            enderecoRepExiste = !!enderecoRepInfo.data;

            if (enderecoRepExiste) {
              totais.enderecosExistentes++;
            } else {
              totais.enderecosFaltantes++;
            }
          } else {
            totais.enderecosFaltantes++;
          }

          elementosEnderecos.push({
            tipo: 'endereco',
            identificador: String(enderecoRep.id ?? `rep-${documentoRep}`),
            nome: `Endereço de ${rep.nome ?? 'Representante'}`,
            dadosBrutos: enderecoRep as unknown as Record<string, unknown>,
            statusPersistencia: enderecoRepExiste ? 'existente' : 'faltando',
            contexto: {
              entidadeId: repInfo?.id,
              entidadeTipo: 'representante' as EntidadeTipoEndereco,
            },
            erro: !repInfo ? 'Representante não existe no banco' : undefined,
          });
        }
      }
    }
  }

  return {
    partes: elementosPartes,
    enderecos: elementosEnderecos,
    representantes: elementosRepresentantes,
    totais,
  };
}

/**
 * Busca endereço existente para uma entidade
 */
async function buscarEnderecoExistente(
  supabase: ReturnType<typeof createServiceClient>,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoPJE: EnderecoPJEPayload
): Promise<{ id: number } | null> {
  // Primeiro tenta buscar por id_pje se disponível
  if (enderecoPJE.id) {
    const { data } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id_pje', enderecoPJE.id)
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .maybeSingle();

    if (data) {
      return { id: data.id };
    }
  }

  // Se não tem id_pje ou não encontrou, buscar por entidade
  const { data } = await supabase
    .from('enderecos')
    .select('id')
    .eq('entidade_tipo', entidadeTipo)
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  return data ? { id: data.id } : null;
}

/**
 * Busca representante existente por CPF
 */
async function buscarRepresentanteExistente(
  supabase: ReturnType<typeof createServiceClient>,
  documento: string
): Promise<{ id: number } | null> {
  const documentoLimpo = documento.replace(/\D/g, '');

  const { data } = await supabase
    .from('representantes')
    .select('id')
    .eq('cpf', documentoLimpo)
    .maybeSingle();

  return data ? { id: data.id } : null;
}

// ============================================================================
// Funções de Extração por Tipo de Captura
// ============================================================================

/**
 * Resultado genérico da extração de elementos por tipo
 */
export interface ElementosPorTipoResult {
  tipoCaptura: TipoCaptura;
  elementos: ElementoRecuperavel[];
  suportaRepersistencia: boolean;
  mensagem?: string;
  totais: {
    total: number;
    existentes: number;
    faltantes: number;
  };
}

/**
 * Extrai elementos do payload conforme o tipo de captura
 *
 * Cada tipo de captura tem estrutura diferente:
 * - partes: partes, endereços, representantes (suporta re-persistência)
 * - pendentes: processos pendentes (apenas visualização)
 * - audiencias: audiências (apenas visualização)
 *
 * @param rawLogId - ID do log bruto
 * @returns Elementos extraídos com informações de tipo
 */
export async function extrairElementosPorTipo(
  rawLogId: string
): Promise<ElementosPorTipoResult | null> {
  const documento = await buscarLogPorRawLogId(rawLogId);

  if (!documento) {
    return null;
  }

  const tipoCaptura = (documento as any).tipo_captura as TipoCaptura;

  switch (tipoCaptura) {
    case 'partes':
      return await extrairElementosDePartes(documento);
    case 'pendentes':
      return extrairElementosDePendentes(documento);
    case 'audiencias':
      return extrairElementosDeAudiencias(documento);
    case 'acervo_geral':
      return extrairElementosDeAcervo(documento);
    case 'arquivados':
      return extrairElementosDeArquivados(documento);
    default:
      return {
        tipoCaptura,
        elementos: [],
        suportaRepersistencia: false,
        mensagem: `Tipo de captura "${tipoCaptura}" não suportado para extração de elementos`,
        totais: { total: 0, existentes: 0, faltantes: 0 },
      };
  }
}

/**
 * Extrai elementos de captura de partes (com verificação de persistência)
 */
async function extrairElementosDePartes(
  documento: CapturaRawLog
): Promise<ElementosPorTipoResult> {
  const resultado = await extrairTodosElementos((documento as any).raw_log_id as string);

  if (!resultado) {
    return {
      tipoCaptura: 'partes',
      elementos: [],
      suportaRepersistencia: true,
      mensagem: 'Payload não disponível',
      totais: { total: 0, existentes: 0, faltantes: 0 },
    };
  }

  // Combinar todos os elementos em uma lista única
  const elementos: ElementoRecuperavel[] = [
    ...resultado.partes,
    ...resultado.enderecos,
    ...resultado.representantes,
  ];

  // Recalcular totais diretamente dos elementos para garantir consistência
  // (existentes + faltantes + pendentes + erros = total)
  const existentes = elementos.filter((e) => e.statusPersistencia === 'existente').length;
  const faltantes = elementos.filter((e) => e.statusPersistencia === 'faltando').length;

  return {
    tipoCaptura: 'partes',
    elementos,
    suportaRepersistencia: true,
    totais: {
      total: elementos.length,
      existentes,
      faltantes,
    },
  };
}

/**
 * Extrai elementos de captura de pendentes (apenas visualização)
 */
function extrairElementosDePendentes(
  documento: CapturaRawLog
): ElementosPorTipoResult {
  const payload = (documento as any).payload_bruto;

  if (!payload || !Array.isArray(payload)) {
    return {
      tipoCaptura: 'pendentes',
      elementos: [],
      suportaRepersistencia: false,
      mensagem: 'Payload não disponível ou formato inválido',
      totais: { total: 0, existentes: 0, faltantes: 0 },
    };
  }

  const elementos: ElementoRecuperavel[] = payload.map((pendente: PendentePayload) => ({
    tipo: 'pendente' as TipoEntidadeRecuperavel,
    identificador: String(pendente.id),
    nome: pendente.numeroProcesso || `Processo ${pendente.id}`,
    dadosBrutos: pendente as unknown as Record<string, unknown>,
    statusPersistencia: 'existente' as const, // Pendentes são apenas visualização
    contexto: {
      numeroProcesso: pendente.numeroProcesso,
      classeJudicial: pendente.classeJudicial,
      prazoVencido: pendente.prazoVencido,
    },
  }));

  return {
    tipoCaptura: 'pendentes',
    elementos,
    suportaRepersistencia: false,
    mensagem: 'Captura de pendentes contém apenas processos pendentes de manifestação. Partes são capturadas separadamente durante dados complementares.',
    totais: {
      total: elementos.length,
      existentes: elementos.length,
      faltantes: 0,
    },
  };
}

/**
 * Extrai elementos de captura de audiências (apenas visualização)
 */
function extrairElementosDeAudiencias(
  documento: CapturaRawLog
): ElementosPorTipoResult {
  const payload = (documento as any).payload_bruto;

  if (!payload) {
    return {
      tipoCaptura: 'audiencias',
      elementos: [],
      suportaRepersistencia: false,
      mensagem: 'Payload não disponível',
      totais: { total: 0, existentes: 0, faltantes: 0 },
    };
  }

  // O payload pode ser paginado ou direto
  const audiencias: AudienciaPayload[] = [];

  if (Array.isArray(payload)) {
    // Pode ser array de páginas ou array de audiências
    for (const item of payload) {
      if (item.resultado && Array.isArray(item.resultado)) {
        // Estrutura paginada
        audiencias.push(...(item.resultado as AudienciaPayload[]));
      } else if (item.id && item.dataInicio) {
        // Audiência direta
        audiencias.push(item as AudienciaPayload);
      }
    }
  }

  const elementos: ElementoRecuperavel[] = audiencias.map((audiencia: AudienciaPayload) => ({
    tipo: 'audiencia' as TipoEntidadeRecuperavel,
    identificador: String(audiencia.id),
    nome: `Audiência ${audiencia.processo?.numero || audiencia.id} - ${audiencia.tipo?.descricao || 'Sem tipo'}`,
    dadosBrutos: audiencia as unknown as Record<string, unknown>,
    statusPersistencia: 'existente' as const,
    contexto: {
      dataInicio: audiencia.dataInicio,
      tipo: audiencia.tipo?.descricao,
      processo: audiencia.processo?.numero,
    },
  }));

  return {
    tipoCaptura: 'audiencias',
    elementos,
    suportaRepersistencia: false,
    mensagem: 'Captura de audiências contém apenas audiências. Partes são capturadas separadamente durante dados complementares.',
    totais: {
      total: elementos.length,
      existentes: elementos.length,
      faltantes: 0,
    },
  };
}

/**
 * Extrai elementos de captura de acervo geral (apenas visualização)
 */
function extrairElementosDeAcervo(
  documento: CapturaRawLog
): ElementosPorTipoResult {
  const payload = (documento as any).payload_bruto;

  if (!payload || !Array.isArray(payload)) {
    return {
      tipoCaptura: 'acervo_geral',
      elementos: [],
      suportaRepersistencia: false,
      mensagem: 'Payload não disponível ou formato inválido',
      totais: { total: 0, existentes: 0, faltantes: 0 },
    };
  }

  const elementos: ElementoRecuperavel[] = payload.map((processo: Record<string, unknown>) => ({
    tipo: 'processo' as TipoEntidadeRecuperavel,
    identificador: String(processo.id || processo.idProcesso),
    nome: (processo.numeroProcesso as string) || `Processo ${processo.id}`,
    dadosBrutos: processo,
    statusPersistencia: 'existente' as const,
    contexto: {
      numeroProcesso: processo.numeroProcesso as string | undefined,
      classeJudicial: processo.classeJudicial as string | undefined,
    },
  }));

  return {
    tipoCaptura: 'acervo_geral',
    elementos,
    suportaRepersistencia: false,
    mensagem: 'Captura de acervo contém apenas processos. Partes são capturadas separadamente.',
    totais: {
      total: elementos.length,
      existentes: elementos.length,
      faltantes: 0,
    },
  };
}

/**
 * Extrai elementos de captura de arquivados (apenas visualização)
 */
function extrairElementosDeArquivados(
  documento: CapturaRawLog
): ElementosPorTipoResult {
  // Arquivados tem mesma estrutura de acervo
  return {
    ...extrairElementosDeAcervo(documento),
    tipoCaptura: 'arquivados',
  };
}

