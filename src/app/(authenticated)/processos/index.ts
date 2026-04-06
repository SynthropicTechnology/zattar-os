/**
 * PROCESSOS MODULE - Exports
 *
 * Re-exporta todos os tipos, schemas, constantes e servicos do modulo de processos.
 * Este arquivo e o ponto de entrada para consumidores externos.
 */

// =============================================================================
// DOMAIN - Tipos, Schemas e Constantes
// =============================================================================

export {
  // Tipos base
  type OrigemAcervo,
  type CodigoTribunal,
  type Ordem,
  type ProcessoSortBy,
  type GrauProcesso,
  StatusProcesso,

  // Entidades
  type Processo,
  type ProcessoInstancia,
  type ProcessoUnificado,
  type AgrupamentoProcesso,
  type Movimentacao,

  // Schemas Zod
  origemAcervoSchema,
  grauProcessoSchema,
  createProcessoSchema,
  updateProcessoSchema,

  // Tipos inferidos
  type CreateProcessoInput,
  type UpdateProcessoInput,
  type ListarProcessosParams,

  // Constantes
  ORIGEM_LABELS,
  GRAU_LABELS,
  STATUS_PROCESSO_LABELS,
  TRIBUNAIS,

  // Funcoes utilitarias
  mapCodigoStatusToEnum,
  validarNumeroCNJ,
} from './domain';

// =============================================================================
// UTILS - Funções Utilitárias
// =============================================================================

export { normalizarNumeroProcesso } from './utils';

// =============================================================================
// SERVICE - Casos de Uso
// =============================================================================

export {
  criarProcesso,
  buscarProcesso,
  buscarProcessoUnificado,
  buscarProcessoPorNumero,
  listarProcessos,
  atualizarProcesso,
  buscarTimeline,
  buscarUsuariosRelacionados,
  listarTribunais,
  buscarProcessosPorClienteCPF,
  buscarProcessosPorClienteCNPJ,
} from './service';

// =============================================================================
// REPOSITORY - Acesso a Dados (para uso avancado/testes)
// =============================================================================

export {
  findProcessoById,
  findProcessoUnificadoById,
  findAllProcessos,
  findTimelineByProcessoId,
  saveProcesso,
  updateProcesso,
  advogadoExists,
  usuarioExists,
} from './repository';

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  PROCESSOS_FILTER_CONFIGS,
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
  parseProcessosFilters,
  ProcessosEmptyState,
  ProcessoHeader,
  ProcessoVisualizacao,
  GrauBadges,
  GrauBadgesSimple,
  TimelineContainer,
  TimelineItem,
  TimelineEmpty,
  TimelineError,
  TimelineLoading,
  ProcessoDetailSheet,
  ProcessoForm,
  ProcessosTableWrapper,
} from './components';

// =============================================================================
// COCKPIT COMPONENTS
// =============================================================================

// Cockpit components
export { CaseIdentityBar } from './components/cockpit/case-identity-bar';
export { AttentionStrip } from './components/cockpit/attention-strip';
export { AllDetailsSheet } from './components/cockpit/all-details-sheet';
export { PulseTimeline } from './components/cockpit/pulse-timeline';
export { TimelineFilterChips } from './components/cockpit/timeline-filter-chips';
export { TimelineMonthGroup } from './components/cockpit/timeline-month-group';
export { TimelineNowMarker } from './components/cockpit/timeline-now-marker';
export { TimelinePhaseMarker } from './components/cockpit/timeline-phase-marker';
export type { TimelineFilterType, FutureTimelineItem, ProcessoPhase } from './components/cockpit/types';

// =============================================================================
// LISTAGEM GLASS BRIEFING COMPONENTS
// =============================================================================

// Listagem Glass Briefing components
export { ProcessosClient } from './processos-client';
export { ProcessoCard } from './components/processo-card';
export { ProcessoListRow } from './components/processo-list-row';
export { ProcessosPulseStrip } from './components/processos-pulse-strip';
export { ProcessosInsightBanner } from './components/processos-insight-banner';

// Stats
export { actionObterEstatisticasProcessos } from './actions/estatisticas-actions';
export type { ProcessoStats } from './service-estatisticas';
