/**
 * CONTRATOS FEATURE - Tipos Configuráveis (Public API)
 *
 * Ponto de entrada público para o submódulo de tipos configuráveis.
 * Exporta tipos, schemas e repositórios para uso externo.
 *
 * Uso:
 * import { contratoTiposRepo, ContratoTipo, createContratoTipoSchema } from '@/app/(authenticated)/contratos/tipos-config';
 */

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================
export type {
  ContratoTipo,
  ContratoTipoCobranca,
  CreateContratoTipoInput,
  UpdateContratoTipoInput,
  ListarTiposParams,
} from './types';

// =============================================================================
// SCHEMAS ZOD
// =============================================================================
export {
  createContratoTipoSchema,
  updateContratoTipoSchema,
} from './types';

// =============================================================================
// REPOSITÓRIOS
// =============================================================================
export {
  contratoTiposRepo,
  contratoTiposCobrancaRepo,
} from './repository';

// =============================================================================
// HOOKS (client-side)
// =============================================================================
export {
  useContratoTipos,
  useContratoTiposCobranca,
  usePipelines,
} from './hooks';
