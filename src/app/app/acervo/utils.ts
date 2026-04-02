import {
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  CLASSE_JUDICIAL_NOMES,
} from './domain';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type {
  ProcessoClienteCpfRow,
  TimelineItemIA,
  UltimaMovimentacaoIA,
  InstanciaProcessoIA,
  ProcessoRespostaIA,
  TimelineStatus,
} from './domain';

// ============================================================================
// Data Formatting
// ============================================================================

/**
 * Formats CPF for display (123.456.789-01)
 */
export function formatarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;

  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats date to DD/MM/YYYY
 */
export function formatarData(data: string | Date | null): string | null {
  if (!data) return null;

  const dateObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dateObj.getTime())) return null;

  const dia = dateObj.getDate().toString().padStart(2, '0');
  const mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const ano = dateObj.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formats date and time to DD/MM/YYYY às HH:mm
 */
export function formatarDataHora(data: string | Date | null): string | null {
  if (!data) return null;

  const dateObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dateObj.getTime())) return null;

  const dataFormatada = formatarData(dateObj);
  const hora = dateObj.getHours().toString().padStart(2, '0');
  const minuto = dateObj.getMinutes().toString().padStart(2, '0');

  return `${dataFormatada} às ${hora}:${minuto}`;
}

/**
 * Translates TRT code to full name
 */
export function traduzirTrt(trt: string): string {
  const trtNormalizado = trt.toUpperCase().replace('TRT', 'TRT');
  return TRT_NOMES[trtNormalizado] || trt;
}

/**
 * Translates tipo_parte to friendly text
 */
export function traduzirTipoParte(tipoParte: string): string {
  return TIPO_PARTE_NOMES[tipoParte] || tipoParte;
}

/**
 * Translates classe_judicial to friendly text
 */
export function traduzirClasseJudicial(classe: string): string {
  return CLASSE_JUDICIAL_NOMES[classe] || classe;
}

// ============================================================================
// Timeline Formatting
// ============================================================================

/**
 * Formats a timeline item for AI response
 */
export function formatarItemTimeline(
  item: TimelineItemEnriquecido
): TimelineItemIA {
  const evento = item.documento
    ? item.tipo || 'Documento'
    : 'Movimento';

  return {
    data: formatarData(item.data) || 'Data não informada',
    evento,
    descricao: item.titulo || '',
    tem_documento: !!item.documento,
  };
}

/**
 * Formats complete timeline, sorting from newest to oldest
 * and limiting the number of items
 */
export function formatarTimeline(
  timeline: TimelineItemEnriquecido[] | null | undefined,
  limite: number = 20
): TimelineItemIA[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  // Sort from newest to oldest
  const ordenada = [...timeline].sort((a, b) => {
    const dataA = new Date(a.data).getTime();
    const dataB = new Date(b.data).getTime();
    return dataB - dataA;
  });

  // Limit and format
  return ordenada.slice(0, limite).map(formatarItemTimeline);
}

/**
 * Extracts the last movement from timeline
 */
export function extrairUltimaMovimentacao(
  timeline: TimelineItemIA[]
): UltimaMovimentacaoIA | null {
  if (timeline.length === 0) return null;

  const ultima = timeline[0]; // Already sorted from newest
  return {
    data: ultima.data,
    evento: ultima.evento,
  };
}

// ============================================================================
// Process Grouping
// ============================================================================

/**
 * Grouped process interface
 */
export interface ProcessoAgrupado {
  numero_processo: string;
  trt: string;
  classe_judicial: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  segredo_justica: boolean;
  tipo_parte: string;
  polo: string;
  instancias: {
    primeiro_grau: ProcessoClienteCpfRow | null;
    segundo_grau: ProcessoClienteCpfRow | null;
  };
}

/**
 * Groups processes by numero_processo
 */
export function agruparProcessosPorNumero(
  processos: ProcessoClienteCpfRow[]
): ProcessoAgrupado[] {
  const mapa = new Map<string, ProcessoAgrupado>();

  for (const processo of processos) {
    const key = processo.numero_processo;

    if (!mapa.has(key)) {
      mapa.set(key, {
        numero_processo: processo.numero_processo,
        trt: processo.trt,
        classe_judicial: processo.classe_judicial,
        nome_parte_autora: processo.nome_parte_autora,
        nome_parte_re: processo.nome_parte_re,
        segredo_justica: processo.segredo_justica,
        tipo_parte: processo.tipo_parte,
        polo: processo.polo,
        instancias: {
          primeiro_grau: null,
          segundo_grau: null,
        },
      });
    }

    const agrupado = mapa.get(key)!;

    if (processo.grau === 'primeiro_grau') {
      agrupado.instancias.primeiro_grau = processo;
    } else if (processo.grau === 'segundo_grau') {
      agrupado.instancias.segundo_grau = processo;
    }
  }

  return Array.from(mapa.values());
}

// ============================================================================
// Final API Formatting
// ============================================================================

/**
 * Formats a process instance for response
 */
export function formatarInstancia(
  instancia: ProcessoClienteCpfRow | null
): InstanciaProcessoIA | null {
  if (!instancia) return null;

  return {
    vara: instancia.descricao_orgao_julgador,
    data_inicio: formatarData(instancia.data_autuacao) || 'Não informada',
    proxima_audiencia: formatarDataHora(instancia.data_proxima_audiencia),
  };
}

/**
 * Additional options for process formatting
 */
export interface FormatarProcessoOpcoes {
  timelineStatus?: TimelineStatus;
  timelineMensagem?: string;
}

/**
 * Formats a grouped process with its timelines for API response
 */
export function formatarProcessoParaIA(
  agrupado: ProcessoAgrupado,
  timelinePrimeiroGrau: TimelineItemIA[],
  timelineSegundoGrau: TimelineItemIA[],
  opcoes?: FormatarProcessoOpcoes
): ProcessoRespostaIA {
  // Combine timelines and sort
  const timelineCombinada = [...timelinePrimeiroGrau, ...timelineSegundoGrau]
    .sort((a, b) => {
      // Convert DD/MM/YYYY to Date for sorting
      const parseData = (str: string) => {
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia).getTime();
      };
      return parseData(b.data) - parseData(a.data);
    })
    .slice(0, 30); // Limit to 30 items total

  // Determine opposing party (inverse of client's pole)
  const parteContraria = agrupado.polo === 'ATIVO'
    ? agrupado.nome_parte_re
    : agrupado.nome_parte_autora;

  // Determine timeline status
  const timelineStatus: TimelineStatus = opcoes?.timelineStatus
    ?? (timelineCombinada.length > 0 ? 'disponivel' : 'indisponivel');

  const resultado: ProcessoRespostaIA = {
    numero: agrupado.numero_processo,
    tipo: traduzirClasseJudicial(agrupado.classe_judicial),
    papel_cliente: traduzirTipoParte(agrupado.tipo_parte),
    parte_contraria: parteContraria,
    tribunal: traduzirTrt(agrupado.trt),
    sigilo: agrupado.segredo_justica,
    instancias: {
      primeiro_grau: formatarInstancia(agrupado.instancias.primeiro_grau),
      segundo_grau: formatarInstancia(agrupado.instancias.segundo_grau),
    },
    timeline: timelineCombinada,
    timeline_status: timelineStatus,
    ultima_movimentacao: extrairUltimaMovimentacao(timelineCombinada),
  };

  // Add message only if not available
  if (opcoes?.timelineMensagem && timelineStatus !== 'disponivel') {
    resultado.timeline_mensagem = opcoes.timelineMensagem;
  }

  return resultado;
}
