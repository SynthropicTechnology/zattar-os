/**
 * Barrel export principal do módulo Dashboard
 *
 * Este é o ponto de entrada principal para o módulo Dashboard.
 * Importações devem ser feitas preferencialmente a partir deste arquivo:
 *
 * @example
 * import { DashboardContent, useDashboard, actionObterDashboard } from '@/app/(authenticated)/dashboard';
 * import type { DashboardData, DashboardUsuarioData } from '@/app/(authenticated)/dashboard';
 */

// Types
export type * from './domain';

// Type Guards
export { isDashboardAdmin, isDashboardUsuario } from './domain';

// Domain (Schemas Zod)
export * from './domain';

// Utils
export * from './utils';

// Hooks
export * from './hooks';

// Actions
export * from './actions';

// Components
export * from './components';
