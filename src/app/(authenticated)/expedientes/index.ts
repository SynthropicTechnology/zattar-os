/**
 * Expedientes Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de expedientes.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * Entidades: Expedientes (CRUD, baixa, reversão, bulk actions)
 */

// ============================================================================
// Components
// ============================================================================
export { ExpedientesContent } from './components/expedientes-content';
export { ExpedientesListWrapper } from './components/expedientes-list-wrapper';
export { ExpedientesTableWrapper } from './components/expedientes-table-wrapper';
export { ExpedientesMonthWrapper } from './components/expedientes-month-wrapper';
export { ExpedientesYearWrapper } from './components/expedientes-year-wrapper';
export { ExpedientesControlView } from './components/expedientes-control-view';
export { ExpedientesPulseStrip } from './components/expedientes-pulse-strip';
export { ExpedientesWeekMission } from './components/expedientes-week-mission';
export { RiskScoreGauge, AgingFunnel, ActivityHeatmap } from './components/expedientes-sidebar-widgets';
export { ExpedientesListFilters } from './components/expedientes-list-filters';
export { ExpedientesCalendar } from './components/expedientes-calendar';
export { ExpedientesCalendarMonth } from './components/expedientes-calendar-month';
export { ExpedientesCalendarYear } from './components/expedientes-calendar-year';
export { ExpedienteDialog } from './components/expediente-dialog';
export { ExpedienteVisualizarDialog } from './components/expediente-visualizar-dialog';
export { ExpedientesBaixarDialog } from './components/expedientes-baixar-dialog';
export { ExpedientesReverterBaixaDialog } from './components/expedientes-reverter-baixa-dialog';
export { ExpedienteDetalhesDialog } from './components/expediente-detalhes-dialog';
export { ParteDetalheDialog } from './components/parte-detalhe-dialog';
export { PdfViewerDialog } from './components/pdf-viewer-dialog';

// ============================================================================
// Hooks
// ============================================================================
export { useExpedientes } from './hooks';
export type { BuscarExpedientesParams, UseExpedientesOptions, UseExpedientesResult } from './hooks';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  actionCriarExpediente,
  actionAtualizarExpediente,
  actionBaixarExpediente,
  actionReverterBaixa,
  actionListarExpedientes,
  actionBulkTransferirResponsavel,
  actionBulkBaixar,
} from './actions';

export type { ActionResult } from './actions';

// ============================================================================
// Types / Domain
// ============================================================================
export type {
  Expediente,
  ExpedienteSortBy,
  ListarExpedientesParams,
  ExpedientesFilters,
} from './domain';

export {
  OrigemExpediente,
  GrauTribunal,
  CodigoTribunal,
  ORIGEM_EXPEDIENTE_LABELS,
  GRAU_TRIBUNAL_LABELS,
  ResultadoDecisao,
  RESULTADO_DECISAO_LABELS,
  createExpedienteSchema,
  updateExpedienteSchema,
  baixaExpedienteSchema,
  reverterBaixaSchema,
  getExpedientePartyNames,
} from './domain';
