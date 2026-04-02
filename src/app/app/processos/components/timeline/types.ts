/**
 * Tipos locais da timeline da sidebar.
 *
 * Define o tipo unificado que estende o item enriquecido da API PJE
 * com metadados de grau e instância de origem (para processos multi-instância).
 */

import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/app/partes';

/**
 * Item de timeline com informações de origem para processos multi-instância.
 *
 * Estende `TimelineItemEnriquecido` com campos que indicam de qual grau
 * e TRT o item foi originado, útil quando a timeline consolida múltiplas instâncias.
 */
export interface TimelineItemUnificado extends TimelineItemEnriquecido {
  /** Grau de jurisdição de origem do item (1º grau, 2º grau, TST) */
  grauOrigem?: GrauProcesso;
  /** Sigla do TRT de origem, ex: "TRT2", "TRT15" */
  trtOrigem?: string;
  /** ID interno da instância de origem */
  instanciaId?: number;
}
