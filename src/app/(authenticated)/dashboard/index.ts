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

// ============================================================================
// Types / Domain
// ============================================================================
export type * from './domain';
export { isDashboardAdmin, isDashboardUsuario } from './domain';
export * from './domain';

// ============================================================================
// Repository
// ============================================================================
export * from './repository';

// ============================================================================
// Service
// ============================================================================
export * from './service';

// ============================================================================
// Actions
// ============================================================================
export * from './actions';

// ============================================================================
// Hooks
// ============================================================================
export * from './hooks';

// ============================================================================
// Components
// ============================================================================
export * from './components';

// ============================================================================
// Utils
// ============================================================================
export * from './utils';
