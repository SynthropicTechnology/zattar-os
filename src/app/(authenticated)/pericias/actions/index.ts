/**
 * Perícias — Server Actions (Barrel Export)
 *
 * Re-exporta todas as server actions do módulo de perícias.
 * Importações cross-módulo devem usar este barrel.
 */
export {
    actionListarPericias,
    actionObterPericia,
    actionAtribuirResponsavel,
    actionAdicionarObservacao,
    actionListarEspecialidadesPericia,
    actionCriarPericia,
} from './pericias-actions';

export type { ActionResult } from './pericias-actions';
