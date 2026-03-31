/**
 * DASHBOARD DESIGN SYSTEM — Barrel Export
 * ============================================================================
 * Exporta todas as primitivas de widgets e utilitários do design system.
 * Use: import { GlassPanel, Sparkline, GaugeMeter, ... } from '@/components/dashboard'
 * ============================================================================
 */

export {
  // Layout
  GlassPanel,
  WidgetContainer,
  GallerySection,
  ListItem,

  // Charts
  Sparkline,
  MiniArea,
  MiniBar,
  MiniDonut,
  StackedBar,
  Treemap,

  // Indicators
  UrgencyDot,
  ProgressRing,
  GaugeMeter,
  AnimatedNumber,

  // Intelligence
  InsightBanner,
  TabToggle,
  CalendarHeatmap,
  ComparisonStat,

  // Data display
  Stat,

  // Helpers
  fmtMoeda,
  fmtNum,
  fmtData,
} from '@/app/app/dashboard/mock/widgets/primitives';

// ─── Entity / CRM Components ─────────────────────────────────────────────────

export { EntityCard, getInitials, timeAgo } from './entity-card';
export type { EntityCardData, EntityCardConfig } from './entity-card';

export { EntityListRow } from './entity-list-row';

export { PulseStrip } from './pulse-strip';
export type { PulseItem } from './pulse-strip';

export { TabPills } from './tab-pills';
export type { TabPillOption } from './tab-pills';

export { SearchInput } from './search-input';

export { ViewToggle } from './view-toggle';
