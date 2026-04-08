/**
 * Processos Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de processos.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useProcessos } from '@/app/(authenticated)/processos/hooks/use-processos';
 * import { ProcessosTableWrapper } from '@/app/(authenticated)/processos/components';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useProcessos, ProcessosTableWrapper } from '@/app/(authenticated)/processos';
 *
 * Entidades: Processos, Instâncias, Movimentações, Workspace Annotations
 */

// ============================================================================
// Components
// ============================================================================
export {
  // Toolbar e Filtros
  PROCESSOS_FILTER_CONFIGS,
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
  parseProcessosFilters,
  // Estados vazios
  ProcessosEmptyState,
  // Visualização
  ProcessoHeader,
  ProcessoVisualizacao,
  // Badges
  GrauBadges,
  GrauBadgesSimple,
  ProcessoStatusBadge,
  // Indicadores
  ProximaAudienciaPopover,
  // Timeline
  TimelineContainer,
  TimelineItem,
  TimelineEmpty,
  TimelineError,
  TimelineLoading,
  // Formulários e Sheets
  ProcessoDetailSheet,
  ProcessoForm,
  ProcessosTableWrapper,
  // Dialog de Tags
  ProcessoTagsDialog,
} from './components';

// --- Cockpit Components ---
export { CaseIdentityBar } from './components/cockpit/case-identity-bar';
export { AttentionStrip } from './components/cockpit/attention-strip';
export { AllDetailsSheet } from './components/cockpit/all-details-sheet';
export { PulseTimeline } from './components/cockpit/pulse-timeline';
export { TimelineFilterChips } from './components/cockpit/timeline-filter-chips';
export { TimelineMonthGroup } from './components/cockpit/timeline-month-group';
export { TimelineNowMarker } from './components/cockpit/timeline-now-marker';
export { TimelinePhaseMarker } from './components/cockpit/timeline-phase-marker';
export type { TimelineFilterType, FutureTimelineItem, ProcessoPhase } from './components/cockpit/types';

// --- Listagem / Glass Briefing Components ---
export { ProcessosClient } from './processos-client';
export { ProcessoCard } from './components/processo-card';
export { ProcessoListRow } from './components/processo-list-row';
export { ProcessosPulseStrip } from './components/processos-pulse-strip';
export { ProcessosInsightBanner } from './components/processos-insight-banner';

// ============================================================================
// Hooks
// ============================================================================
export {
  useProcessos,
  useAcervo,
} from './hooks';

export { useProcessoDetail } from './hooks';

export {
  useProcessoTimeline,
  type TimelineItemUnificado,
  type TimelineUnificadaMetadata,
  type TimelineData,
} from './hooks';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  actionCriarProcesso,
  actionAtualizarProcesso,
  actionListarProcessos,
  actionBuscarProcesso,
  actionBuscarTimeline,
  actionAtribuirResponsavelEmLote,
  actionBuscarProcessosPorCPF,
  actionBuscarProcessosPorCNPJ,
  actionBuscarProcessoPorNumero,
  actionCriarProcessoManual,
  actionObterDetalhesComplementaresProcesso,
} from './actions';

export type { ActionResult } from './actions';

// --- Estatísticas ---
export { actionObterEstatisticasProcessos } from './actions/estatisticas-actions';
export type { ProcessoStats } from './service-estatisticas';

// --- Indexação ---
export {
  actionIndexarPecaProcesso,
  actionIndexarAndamentoProcesso,
  actionReindexarProcesso,
} from './actions/indexing-actions';

// --- Workspace Annotations ---
export {
  actionListarProcessoWorkspaceAnotacoes,
  actionCriarProcessoWorkspaceAnotacao,
  actionDeletarProcessoWorkspaceAnotacao,
} from './actions/workspace-annotations-actions';

// ============================================================================
// Types / Domain
// ============================================================================

// --- Core domain types ---
export {
  StatusProcesso,
  origemAcervoSchema,
  grauProcessoSchema,
  createProcessoSchema,
  updateProcessoSchema,
  ORIGEM_LABELS,
  GRAU_LABELS,
  STATUS_PROCESSO_LABELS,
  TRIBUNAIS,
  mapCodigoStatusToEnum,
  validarNumeroCNJ,
} from './domain';

export type {
  OrigemAcervo,
  CodigoTribunal,
  Ordem,
  ProcessoSortBy,
  GrauProcesso,
  Processo,
  ProcessoInstancia,
  ProcessoUnificado,
  AgrupamentoProcesso,
  Movimentacao,
  CreateProcessoInput,
  UpdateProcessoInput,
  ListarProcessosParams,
} from './domain';

// --- Workspace Annotations domain ---
export {
  processoWorkspaceAnnotationSchema,
  listarProcessoWorkspaceAnotacoesSchema,
  criarProcessoWorkspaceAnotacaoSchema,
  deletarProcessoWorkspaceAnotacaoSchema,
} from './workspace-annotations-domain';

export type {
  ProcessoWorkspaceAnnotation,
  CriarProcessoWorkspaceAnotacaoInput,
  DeletarProcessoWorkspaceAnotacaoInput,
} from './workspace-annotations-domain';

// --- Frontend-specific types (types/) ---
export type {
  OrdenarPorAcervo,
  AgruparPorAcervo,
  OrdemAcervo,
  ListarAcervoParams,
  AcervoApiResponse,
  BuscarProcessosParams,
  ProcessosFilters,
  FiltrosProcesso,
} from './types';

// ============================================================================
// Utils
// ============================================================================
export { normalizarNumeroProcesso } from './utils';

// ============================================================================
// Service (server-only — re-exportado para cross-módulo)
// ============================================================================
// ⚠️ Estas funções são server-only. Prefira import direto quando possível:
//   import { criarProcesso } from '@/app/(authenticated)/processos/service';
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

// ============================================================================
// Repository (server-only — re-exportado para cross-módulo)
// ============================================================================
// ⚠️ Estas funções são server-only. Prefira import direto quando possível:
//   import { findProcessoById } from '@/app/(authenticated)/processos/repository';
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
