/**
 * Timeline Sidebar - Barrel export
 *
 * Exporta todos os componentes e tipos do redesign da sidebar de timeline.
 * Use imports diretos quando possível para melhor tree-shaking.
 *
 * @example
 * import { TimelineSidebar, TimelineSidebarItem } from '@/features/processos/components/timeline';
 * import type { TimelineItemUnificado } from '@/features/processos/components/timeline';
 */

// Componentes principais
export { TimelineSidebar } from './timeline-sidebar';
export { TimelineSidebarItem } from './timeline-sidebar-item';
export { TimelineSidebarHeader } from './timeline-sidebar-header';
export { TimelineContextCard } from './timeline-context-card';
export { TimelineTypeBadge } from './timeline-type-badge';

// Utilitários e constantes
export { getTimelineItemMeta } from './constants';
export type { TimelineItemMeta } from './constants';

// Tipos
export type { TimelineItemUnificado } from './types';
