/**
 * Contratos Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de contratos.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * Entidades: Contratos, Segmentos, Pipelines, Tipos Configuráveis
 */

// ============================================================================
// Components
// ============================================================================
export {
  getContratosColumns,
  ContratoForm,
  ContratoDeleteDialog,
  SegmentosDialog,
  SegmentosFilter,
  // Pipeline UI
  ContratoCard,
  ContratoListRow,
  PipelineFunnel,
  FinancialStrip,
  KanbanColumn,
  // Glass Briefing
  ContratosContent,
  ContratosPulseStrip,
  ContratosPipelineStepper,
  ContratosListWrapper,
  ContratosGlassList,
  ContratosKanbanView,
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

// ============================================================================
// Hooks
// ============================================================================
export { useContratos } from './hooks';
export { useSegmentos } from './hooks';
export type { SegmentoOption } from './hooks';
export { useKanbanContratos, SEM_ESTAGIO_KEY } from './hooks';
export type { KanbanContrato, KanbanColumns } from './hooks';
export { useContratosPage } from './hooks';
export type { UseContratosPageParams, UseContratosPageResult } from './hooks';
export { useContratosStats } from './hooks';
export type { UseContratosStatsResult } from './hooks';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export type { ActionResult } from './actions';
export {
  actionCriarContrato,
  actionAtualizarContrato,
  actionListarContratos,
  actionBuscarContrato,
  actionBuscarContratoCompleto,
  actionContarContratosPorStatus,
  actionContarContratosComEstatisticas,
  actionResolverNomesEntidadesContrato,
  actionExcluirContrato,
  actionAlterarStatusContratosEmMassa,
  actionAtribuirResponsavelContratosEmMassa,
  actionAlterarSegmentoContratosEmMassa,
  actionExcluirContratosEmMassa,
  actionAlterarResponsavelContrato,
  actionContratosStats,
  actionContratosPulseStats,
} from './actions';

export type { ContratosPulseStats } from './actions';

// --- Segmentos Actions ---
export type {
  Segmento,
  CreateSegmentoInput,
  UpdateSegmentoInput,
} from './actions';
export {
  actionListarSegmentos,
  actionCriarSegmento,
  actionAtualizarSegmento,
  actionDeletarSegmento,
} from './actions';

// ============================================================================
// Types / Domain
// ============================================================================

// --- Core domain types ---
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

// --- Frontend-specific types (types/) ---
export type {
  ContratosApiResponse,
  BuscarContratosParams,
  ContratosFilters,
  PaginationInfo,
  ClienteInfo,
  ResponsavelInfo,
  SegmentoInfo,
} from './types';

// ============================================================================
// Queries (Data fetching for Server Components)
// ============================================================================
export type {
  ContratoCompleto,
  ContratoCompletoStats,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
} from './queries';
export { fetchContratoCompleto } from './queries';

// ============================================================================
// Adapters
// ============================================================================
export { contratoToCardData } from './adapters/contrato-card-adapter';

// ============================================================================
// Utils
// ============================================================================
export {
  formatarSegmentoTipo,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarPapelContratual,
  formatarStatusContrato,
  formatarData,
  formatarDataHora,
} from './utils';

// ============================================================================
// Errors
// ============================================================================
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

// ============================================================================
// Pipelines (Sub-módulo)
// ============================================================================
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

// ============================================================================
// Tipos Config (Sub-módulo)
// ============================================================================
export type {
  ContratoTipo,
  ContratoTipoCobranca,
  CreateContratoTipoInput,
  UpdateContratoTipoInput,
  ListarTiposParams,
} from './tipos-config/types';

// ============================================================================
// PDFs de Contratação (Caminho A — Rascunho Efêmero)
// ============================================================================
export { actionValidarGeracaoPdfs } from './actions/gerar-pdfs-contrato-action';
export {
  validarGeracaoPdfs,
  gerarZipPdfsParaContrato,
} from './services/documentos-contratacao.service';
export type {
  CampoFaltante,
  DadosContratoParaMapping,
  InputDataMapeado,
} from './services/mapeamento-contrato-input-data';

// ============================================================================
// Pacote de Assinatura (Caminho B — Pacote Compartilhado)
// ============================================================================
export { actionEnviarContratoParaAssinatura } from './actions/enviar-contrato-assinatura-action';

// ============================================================================
// Server-only exports
// ============================================================================
// Services e Repositories devem ser importados diretamente:
//   import { criarContrato } from '@/app/(authenticated)/contratos/service';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.
