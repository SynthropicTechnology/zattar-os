/**
 * Barrel export do módulo Repasses
 *
 * Feature minimalista que delega para @/app/(authenticated)/obrigacoes
 *
 * @example
 * import { RepassesPageContent } from '@/app/(authenticated)/repasses';
 */

export { RepassesPageContent } from './components/repasses-page-content';

// Re-exportar tipos e componentes de obrigacoes para conveniência
export type {
  RepassePendente,
  FiltrosRepasses,
} from '@/app/(authenticated)/obrigacoes';

export { useRepassesPendentes } from '@/app/(authenticated)/obrigacoes';
