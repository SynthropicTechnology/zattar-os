/**
 * CONTRATOS FEATURE - Public API
 *
 * Re-exporta todos os módulos públicos da feature contratos.
 * Este é o ponto de entrada principal para importar funcionalidades de contratos.
 *
 * Uso:
 * import { ContratosTableWrapper, listarContratos, Contrato } from '@/app/(authenticated)/contratos';
 */

// =============================================================================
// TYPES & SCHEMAS (Domain)
// =============================================================================
export type {
  SegmentoTipo,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PapelContratual,
  TipoEntidadeContrato,
  ContratoParte,
  ContratoStatusHistorico,
  ContratoProcessoVinculo,
  Contrato,
  CreateContratoInput,
  UpdateContratoInput,
  ListarContratosParams,
  ContratoSortBy,
  Ordem,
} from './domain';

export {
  // Schemas Zod
  tipoContratoSchema,
  tipoCobrancaSchema,
  statusContratoSchema,
  papelContratualSchema,
  tipoEntidadeContratoSchema,
  contratoParteInputSchema,
  createContratoSchema,
  updateContratoSchema,
  // Labels
  SEGMENTO_TIPO_LABELS,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from './domain';

// =============================================================================
// TYPES (Auxiliary - API Response, Filters, etc.)
// =============================================================================
export type {
  ContratosApiResponse,
  BuscarContratosParams,
  ContratosFilters,
  PaginationInfo,
  ClienteInfo,
  ResponsavelInfo,
  SegmentoInfo,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================
export {
  criarContrato,
  buscarContrato,
  listarContratos,
  atualizarContrato,
  listarContratosPorClienteId,
} from './service';

// =============================================================================
// QUERIES (Data fetching for Server Components)
// =============================================================================
export type {
  ContratoCompleto,
  ContratoCompletoStats,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
} from './queries';
export { fetchContratoCompleto } from './queries';

// =============================================================================
// ACTIONS (Server Actions)
// =============================================================================
export type {
  ActionResult,
} from './actions';
export {
  actionCriarContrato,
  actionAtualizarContrato,
  actionListarContratos,
  actionBuscarContrato,
  actionBuscarContratoCompleto,
  actionContarContratosPorStatus,
  actionContarContratosComEstatisticas,
  actionContratosStats,
} from './actions';

// =============================================================================
// HOOKS
// =============================================================================
export { useContratos } from './hooks';

// =============================================================================
// UTILS
// =============================================================================
export {
  formatarSegmentoTipo,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarStatusContrato,
  formatarData,
  formatarDataHora,
  getStatusBadgeStyle,
  getTipoContratoBadgeStyle,
  getStatusVariant,
  getTipoContratoVariant,
} from './utils';

// =============================================================================
// ERRORS
// =============================================================================
export {
  // Error factories
  contratoNotFoundError,
  clienteNotFoundError,
  parteContrariaNotFoundError,
  contratoValidationError,
  contratoIdInvalidError,
  contratoNoFieldsToUpdateError,
  contratoDatabaseError,
  // Error type guards
  isContratoNotFoundError,
  isClienteNotFoundError,
  isParteContrariaNotFoundError,
  isContratoValidationError,
} from './errors';

// =============================================================================
// COMPONENTS
// =============================================================================
export {
  getContratosColumns,
  ContratosTableWrapper,
  ContratoForm,
  ContratoDeleteDialog,
  // Pipeline UI
  ContratoCard,
  ContratoListRow,
  PipelineFunnel,
  FinancialStrip,
  KanbanColumn,
} from './components';

export type {
  ContratoCardData,
  ContratoCardProps,
  ContratoListRowProps,
  PipelineStageData,
  PipelineFunnelProps,
  ContratosStatsData,
  FinancialStripProps,
  KanbanColumnProps,
} from './components';

// =============================================================================
// PIPELINES
// =============================================================================
export type {
  ContratoPipeline,
  ContratoPipelineEstagio,
  CreatePipelineInput,
  UpdatePipelineInput,
  CreateEstagioInput,
  UpdateEstagioInput,
  ReorderEstagiosInput,
  ListarPipelinesParams,
} from './pipelines/types';

// =============================================================================
// TIPOS CONFIG
// =============================================================================
export type {
  ContratoTipo,
  ContratoTipoCobranca,
  CreateContratoTipoInput,
  UpdateContratoTipoInput,
  ListarTiposParams,
} from './tipos-config/types';
