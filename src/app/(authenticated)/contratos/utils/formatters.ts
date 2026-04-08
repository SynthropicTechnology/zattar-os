/**
 * CONTRATOS FEATURE - Utilitários de Formatação
 *
 * Funções utilitárias para formatação de dados de contratos.
 */

import type {
  SegmentoTipo,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PapelContratual,
} from '../domain';

// =============================================================================
// FORMATADORES DE ENUMS
// =============================================================================

/**
 * Formata tipo de segmento para exibição
 *
 * @param segmento - Tipo de segmento (trabalhista, civil, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarSegmentoTipo('trabalhista'); // "Trabalhista"
 * formatarSegmentoTipo(null); // "-"
 * ```
 */
export function formatarSegmentoTipo(segmento: SegmentoTipo | null | undefined): string {
  if (!segmento) return '-';

  const segmentos: Record<SegmentoTipo, string> = {
    trabalhista: 'Trabalhista',
    civil: 'Civil',
    previdenciario: 'Previdenciário',
    criminal: 'Criminal',
    empresarial: 'Empresarial',
    administrativo: 'Administrativo',
  };

  return segmentos[segmento] || segmento;
}


/**
 * Formata tipo de contrato para exibição
 *
 * @param tipo - Tipo de contrato (ajuizamento, defesa, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarTipoContrato('ajuizamento'); // "Ajuizamento"
 * formatarTipoContrato('ato_processual'); // "Ato Processual"
 * ```
 */
export function formatarTipoContrato(tipo: TipoContrato | null | undefined): string {
  if (!tipo) return '-';

  const tipos: Record<TipoContrato, string> = {
    ajuizamento: 'Ajuizamento',
    defesa: 'Defesa',
    ato_processual: 'Ato Processual',
    assessoria: 'Assessoria',
    consultoria: 'Consultoria',
    extrajudicial: 'Extrajudicial',
    parecer: 'Parecer',
  };

  return tipos[tipo] || tipo;
}

/**
 * Formata tipo de cobrança para exibição
 *
 * @param tipo - Tipo de cobrança (pro_exito, pro_labore)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarTipoCobranca('pro_exito'); // "Pró-Êxito"
 * formatarTipoCobranca('pro_labore'); // "Pró-Labore"
 * ```
 */
export function formatarTipoCobranca(tipo: TipoCobranca | null | undefined): string {
  if (!tipo) return '-';

  const tipos: Record<TipoCobranca, string> = {
    pro_exito: 'Pró-Êxito',
    pro_labore: 'Pró-Labore',
  };

  return tipos[tipo] || tipo;
}

/**
 * Formata status do contrato para exibição
 *
 * @param status - Status do contrato (em_contratacao, contratado, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarStatusContrato('em_contratacao'); // "Em Contratação"
 * formatarStatusContrato('distribuido'); // "Distribuído"
 * ```
 */
export function formatarStatusContrato(status: StatusContrato | null | undefined): string {
  if (!status) return '-';

  const statuses: Record<StatusContrato, string> = {
    em_contratacao: 'Em Contratação',
    contratado: 'Contratado',
    distribuido: 'Distribuído',
    desistencia: 'Desistência',
  };

  return statuses[status] || status;
}

export function formatarPapelContratual(papel: PapelContratual | null | undefined): string {
  if (!papel) return '-';

  const papeis: Record<PapelContratual, string> = {
    autora: 'Autora',
    re: 'Ré',
  };

  return papeis[papel] || papel;
}

// =============================================================================
// FORMATADORES DE DATA
// =============================================================================

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 *
 * @param dataISO - String de data em formato ISO (YYYY-MM-DD ou ISO 8601)
 * @returns Data formatada (DD/MM/YYYY) ou '-' se inválida/null
 *
 * @example
 * ```typescript
 * formatarData('2024-01-15'); // "15/01/2024"
 * formatarData('2024-01-15T10:30:00Z'); // "15/01/2024"
 * formatarData(null); // "-"
 * ```
 */
export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return '-';
    // Usa UTC para evitar deslocamento de fuso horário em datas sem hora
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(data);
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 *
 * @param dataISO - String de data/hora em formato ISO
 * @returns Data e hora formatadas ou '-' se inválida/null
 *
 * @example
 * ```typescript
 * formatarDataHora('2024-01-15T10:30:00Z'); // "15/01/2024 10:30"
 * formatarDataHora(null); // "-"
 * ```
 */
export function formatarDataHora(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

