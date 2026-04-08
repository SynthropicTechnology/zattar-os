/**
 * Barrel export — Server Actions do módulo captura
 *
 * Centraliza todas as server actions para importação via:
 * import { actionCapturarTimeline } from '@/app/(authenticated)/captura/actions';
 */

// ============================================================================
// Timeline Actions
// ============================================================================
export {
    actionCapturarTimeline,
    actionRelinkBackblaze,
} from './timeline-actions';

export type { ActionResponse } from './timeline-actions';

// ============================================================================
// Comunica CNJ Actions
// ============================================================================
export {
    actionConsultarComunicacoes,
    actionListarComunicacoesCapturadas,
    actionSincronizarComunicacoes,
    actionObterCertidao,
    actionVincularExpediente,
    actionListarTribunaisDisponiveis,
} from './comunica-cnj-actions';

// ============================================================================
// Utils (internos — auth helper para actions)
// ============================================================================
export { requireAuth } from './utils';
