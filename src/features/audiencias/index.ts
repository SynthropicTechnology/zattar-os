/**
 * Audiências Feature Module - Main barrel export
 *
 * Este módulo centraliza toda a funcionalidade relacionada a audiências:
 * - Visualizações de calendário (semana, mês, ano)
 * - Lista de audiências
 * - Formulários de criação/edição
 * - Filtros e busca
 *
 * @example
 * // Importar componentes
 * import { AudienciasContent, AudienciaCard } from '@/features/audiencias';
 *
 * // Importar hooks
 * import { useAudiencias, useTiposAudiencias } from '@/features/audiencias';
 *
 * // Importar actions
 * import { actionCriarAudiencia } from '@/features/audiencias';
 *
 * // Importar tipos
 * import type { Audiencia, BuscarAudienciasParams } from '@/features/audiencias';
 */

// ============================================================================
// Components
// ============================================================================
export {
  // Main content
  AudienciasContent,
  // Table/List views
  AudienciasListWrapper,
  AudienciasTableWrapper,
  AudienciasMonthWrapper,
  AudienciasYearWrapper,
  AudienciasListFilters,
  getAudienciasColumns,
  // Calendar views
  AudienciasCalendarMonthView,
  AudienciasCalendarYearView,
  AudienciasMonthDayCell,
  // Cards and badges
  AudienciaCard,
  AudienciaStatusBadge,
  AudienciaModalidadeBadge,
  // Forms and dialogs
  AudienciaForm,
  AudienciaDetailSheet,
  // Settings
  TiposAudienciasList,
  // Filters
  AUDIENCIAS_FILTER_CONFIGS,
  buildAudienciasFilterOptions,
  buildAudienciasFilterGroups,
  parseAudienciasFilters,
  // Mission view components
  MissionKpiStrip,
  calcPrepItems,
  calcPrepScore,
  // Glass Briefing views
  AudienciasSemanaView,
  AudienciasMesView,
  AudienciasAnoView,
  AudienciasListaView,
  AudienciasMissaoContent,
} from "./components";

// ============================================================================
// Hooks
// ============================================================================
export { useAudiencias, useTiposAudiencias, useAudienciasUnified } from "./hooks";
export type { AudienciasViewMode } from "./hooks";

// ============================================================================
// Actions
// ============================================================================
export {
  actionCriarAudiencia,
  actionAtualizarAudiencia,
  actionAtualizarStatusAudiencia,
  actionListarAudiencias,
} from "./actions";

export type { ActionResult } from "./actions";

// ============================================================================
// Service
// ============================================================================
export {
  criarAudiencia,
  buscarAudiencia,
  listarAudiencias,
  atualizarAudiencia,
  atualizarStatusAudiencia,
} from "./service";

// NOTE: Server-side services (responsavel.service, virtual.service, ai-agent.service)
// are NOT exported here to prevent Redis/Node.js dependencies from being bundled
// in client components. These services should only be used by server actions.

// ============================================================================
// Repository (for testing purposes)
// ============================================================================
export * as audienciasRepository from "./repository";

// ============================================================================
// Types
// ============================================================================
export {
  // Domain types from core
  StatusAudiencia,
  ModalidadeAudiencia,
  PresencaHibrida,
  CODIGO_TRIBUNAL,
  GrauTribunal,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  createAudienciaSchema,
  updateAudienciaSchema,
  atualizarStatusSchema,
} from "./domain";

export type {
  // Domain types
  CodigoTribunal,
  EnderecoPresencial,
  Audiencia,
  AudienciaSortBy,
  ListarAudienciasParams,
  // Backend types
  GrauAudiencia,
  AudienciaInfra,
  CriarAudienciaInfraParams,
  AtualizarAudienciaInfraParams,
  // Frontend types
  AudienciasApiResponse,
  BuscarAudienciasParams,
  AudienciasFilters,
  AudienciasVisualizacao,
  AudienciasPaginacao,
  UseAudienciasResult,
  UseAudienciasOptions,
  TipoAudiencia,
  UseTiposAudienciasResult,
  // AI Agent types (consolidated from ai-agent.types.ts)
  AudienciaClienteCpfRow,
  ClienteRespostaIA,
  ResumoAudienciasIA,
  LocalAudienciaIA,
  AudienciaRespostaIA,
  AudienciasClienteCpfSuccessResponse,
  AudienciasClienteCpfErrorResponse,
  AudienciasClienteCpfResponse,
} from "./domain";

export {
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  STATUS_AUDIENCIA_NOMES,
} from "./domain";
