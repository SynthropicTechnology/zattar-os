/**
 * Helper para conversão de presets de vencimento em ranges de data
 * Elimina duplicação entre Contas a Pagar e Contas a Receber
 */

import { todayDateString, addDays } from '@/lib/date-utils';

export interface VencimentoRange {
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
}

export type VencimentoPreset = 'vencidas' | 'hoje' | '7dias' | '30dias' | '';

/**
 * Converte um preset de vencimento para um range de datas
 * @param preset - Preset de vencimento
 * @returns Range de datas no formato ISO (YYYY-MM-DD)
 */
export function parseVencimentoFilter(preset: VencimentoPreset): VencimentoRange {
  if (!preset) return {};

  const hojeStr = todayDateString();

  switch (preset) {
    case 'vencidas': {
      return { dataVencimentoFim: addDays(hojeStr, -1) };
    }
    case 'hoje':
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: hojeStr };
    case '7dias': {
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: addDays(hojeStr, 7) };
    }
    case '30dias': {
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: addDays(hojeStr, 30) };
    }
    default:
      return {};
  }
}
