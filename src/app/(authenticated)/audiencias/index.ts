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
 * import { AudienciaCard } from '@/app/(authenticated)/audiencias';
 *
 * // Importar hooks
 * import { useAudiencias, useTiposAudiencias } from '@/app/(authenticated)/audiencias';
 *
 * // Importar actions
 * import { actionCriarAudiencia } from '@/app/(authenticated)/audiencias';
 *
 * // Importar tipos
 * import type { Audiencia, BuscarAudienciasParams } from '@/app/(authenticated)/audiencias';
 */

// ============================================================================
// Components
// ============================================================================
export {
  // List features
  AudienciasListFilters,
  getAudienciasColumns,
  // Cards and badges
  AudienciaCard,
  AudienciaStatusBadge,
  AudienciaModalidadeBadge,
  // Forms and dialogs
  AudienciaForm,
  AudienciaDetailDialog,
  AudienciaIndicadorBadges,
  AUDIENCIA_INDICADOR_SHOW_CONFIGS,
  NovaAudienciaDialog,
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
  actionAtualizarObservacoes,
  actionAtualizarUrlVirtual,
  actionAtualizarEnderecoPresencial,
  actionListarAudiencias,
  actionBuscarAudienciaPorId,
  actionCriarAudienciaPayload,
  actionAtualizarAudienciaPayload,
  actionListarTiposAudiencia,
  actionListarSalasAudiencia,
  actionBuscarAudienciasPorCPF,
  actionBuscarAudienciasPorCNPJ,
  actionBuscarAudienciasPorNumeroProcesso,
} from "./actions";

export type { ActionResult } from "./actions";

// ============================================================================
// Services (especializados)
// ============================================================================
// NOTE: Serviços especializados (AI Agent, Responsável, Virtual) são server-only.
// Import via: import { buscarAudienciasClientePorCpf } from '@/app/(authenticated)/audiencias/services';

// ============================================================================
// Service (principal)
// ============================================================================
// NOTE: Service functions are NOT exported here because service.ts imports
// repository.ts which uses Redis cache-utils with 'server-only'.
// Import directly: import { listarAudiencias } from '@/app/(authenticated)/audiencias/service';

// ============================================================================
// Repository
// ============================================================================
// NOTE: audienciasRepository is NOT exported here because it imports
// Redis cache-utils with 'server-only', which breaks client components.
// Import directly from './repository' in server-side code or tests.

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
