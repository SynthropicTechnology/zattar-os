/**
 * Arquivo: index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as APIs do PJE-TRT de forma centralizada.
 * Permite imports diretos do módulo principal: import { obterTodosProcessosAcervoGeral } from '@/app/(authenticated)/captura/pje-trt'
 */

// Acervo Geral
export {
  obterProcessosAcervoGeral,
  obterTodosProcessosAcervoGeral,
  obterTotalizadoresAcervoGeral,
} from './acervo-geral';

// Expedientes (Pendentes de Manifestação)
export {
  obterProcessosPendentesManifestacao,
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
} from './expedientes';

// Audiências
export {
  obterPautaAudiencias,
  obterTodasAudiencias,
} from './audiencias';

// Perícias
export {
  obterPericias,
} from './pericias';

// Arquivados
export {
  obterProcessosArquivados,
  obterTodosProcessosArquivados,
} from './arquivados';

// Timeline
export {
  obterTimeline,
} from './timeline';
export type { TimelineResponse, ObterTimelineOptions } from './timeline';

// Shared
export { fetchPJEAPI } from './shared/fetch';

// Re-exportar tipos compartilhados
export { AgrupamentoProcessoTarefa } from '../types/types';
export type { Processo, Audiencia, Totalizador, PagedResponse } from '../types/types';
export type { Pericia } from '../types';
