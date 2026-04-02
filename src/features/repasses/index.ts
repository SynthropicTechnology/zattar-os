/**
 * Barrel export do módulo Repasses
 *
 * Feature minimalista que delega para @/app/app/obrigacoes
 *
 * @example
 * import { RepassesPageContent } from '@/features/repasses';
 */

export { RepassesPageContent } from './components/repasses-page-content';

// Re-exportar tipos e componentes de obrigacoes para conveniência
export type {
  RepassePendente,
  FiltrosRepasses,
} from '@/app/app/obrigacoes';

export { useRepassesPendentes } from '@/app/app/obrigacoes';
