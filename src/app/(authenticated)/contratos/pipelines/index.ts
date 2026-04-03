/**
 * CONTRATOS PIPELINES - Public API
 *
 * Re-exporta todos os módulos públicos do sub-módulo de pipelines.
 *
 * Uso:
 * import { ContratoPipeline, findAllPipelines } from '@/app/(authenticated)/contratos/pipelines';
 */

// =============================================================================
// TYPES & SCHEMAS
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
} from './types';

export {
  createPipelineSchema,
  updatePipelineSchema,
  createEstagioSchema,
  updateEstagioSchema,
  reorderEstagiosSchema,
} from './types';

// =============================================================================
// REPOSITORY (camada de persistência)
// =============================================================================

export {
  // Pipelines
  findAllPipelines,
  findPipelineById,
  findPipelineBySegmentoId,
  savePipeline,
  updatePipeline,
  deletePipeline,
  // Estágios
  findEstagioById,
  findEstagioDefaultByPipelineId,
  saveEstagio,
  updateEstagio,
  deleteEstagio,
  reorderEstagios,
  // Verificações
  countContratosByEstagioId,
  countContratosByPipelineId,
} from './repository';
