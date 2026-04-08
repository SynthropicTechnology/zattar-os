/**
 * Barrel export para Server Actions da feature Expedientes
 *
 * Organiza todas as actions de:
 * - Expedientes (CRUD, baixa, reversão, listagem)
 * - Bulk Actions (transferência em massa, baixa em massa)
 */

// =============================================================================
// EXPEDIENTES - Server Actions
// =============================================================================
export {
  actionCriarExpediente,
  actionAtualizarExpediente,
  actionBaixarExpediente,
  actionReverterBaixa,
  actionListarExpedientes,
} from './expediente-actions';

export type { ActionResult } from './expediente-actions';

// =============================================================================
// BULK ACTIONS
// =============================================================================
export {
  actionBulkTransferirResponsavel,
  actionBulkBaixar,
} from './expediente-bulk-actions';
