/**
 * EVENT COLORS — Design System
 * ============================================================================
 * Single source of truth para cores de eventos do calendário/agenda.
 *
 * Conecta tipos de fonte de evento (audiência, expediente, obrigação, perícia,
 * agenda) aos tokens semânticos definidos em globals.css (--event-*).
 *
 * Substitui mappings duplicados em:
 *   - src/app/(authenticated)/agenda/mock/data.ts (COLOR_MAP)
 *   - src/app/(authenticated)/calendar/briefing-domain.ts
 *   - src/components/calendar/helpers.ts
 *   - src/app/(authenticated)/dashboard/mock/widgets/section-financeiro.tsx
 *
 * USO:
 *   import { getEventColorClasses } from '@/lib/design-system/event-colors'
 *   const c = getEventColorClasses('audiencia')
 *   <div className={c.bgSoft}>...</div>
 *   <span className={c.text}>...</span>
 *
 * @ai-context NUNCA hardcode classes de cor para eventos (ex: bg-sky-500).
 * Use sempre este helper. Se precisar de uma cor nova, adicione um token
 * `--event-{nome}` em globals.css primeiro.
 * ============================================================================
 */

export type EventType =
  | 'audiencia'
  | 'expediente'
  | 'obrigacao'
  | 'pericia'
  | 'agenda'
  | 'prazo'
  | 'default'

/** Aliases legacy — mantém compat com código antigo que usa nome de cor Tailwind */
export type LegacyEventColor =
  | 'sky'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'emerald'
  | 'orange'

const LEGACY_TO_TYPE: Record<LegacyEventColor, EventType> = {
  sky: 'audiencia',
  amber: 'expediente',
  violet: 'pericia',
  rose: 'prazo',
  emerald: 'agenda',
  orange: 'obrigacao',
}

export interface EventColorClasses {
  /** Background com opacidade para cards/cells (substitui bg-sky-200/50 etc.) */
  bgSoft: string
  /** Background sólido para dots/badges */
  bgSolid: string
  /** Cor de texto sobre superfície clara */
  text: string
  /** Border sutil */
  border: string
  /** Dot indicator */
  dot: string
  /** Token CSS bruto — para inline styles, charts, gradients */
  cssVar: string
}

/**
 * Mapeamento canônico: tipo de evento → classes utilitárias.
 * Cada classe usa o token correspondente em globals.css.
 */
const EVENT_COLOR_MAP: Record<EventType, EventColorClasses> = {
  audiencia: {
    bgSoft: 'bg-event-audiencia/15',
    bgSolid: 'bg-event-audiencia',
    text: 'text-event-audiencia',
    border: 'border-event-audiencia/40',
    dot: 'bg-event-audiencia',
    cssVar: 'var(--event-audiencia)',
  },
  expediente: {
    bgSoft: 'bg-event-expediente/15',
    bgSolid: 'bg-event-expediente',
    text: 'text-event-expediente',
    border: 'border-event-expediente/40',
    dot: 'bg-event-expediente',
    cssVar: 'var(--event-expediente)',
  },
  obrigacao: {
    bgSoft: 'bg-event-obrigacao/15',
    bgSolid: 'bg-event-obrigacao',
    text: 'text-event-obrigacao',
    border: 'border-event-obrigacao/40',
    dot: 'bg-event-obrigacao',
    cssVar: 'var(--event-obrigacao)',
  },
  pericia: {
    bgSoft: 'bg-event-pericia/15',
    bgSolid: 'bg-event-pericia',
    text: 'text-event-pericia',
    border: 'border-event-pericia/40',
    dot: 'bg-event-pericia',
    cssVar: 'var(--event-pericia)',
  },
  agenda: {
    bgSoft: 'bg-event-agenda/15',
    bgSolid: 'bg-event-agenda',
    text: 'text-event-agenda',
    border: 'border-event-agenda/40',
    dot: 'bg-event-agenda',
    cssVar: 'var(--event-agenda)',
  },
  prazo: {
    bgSoft: 'bg-event-prazo/15',
    bgSolid: 'bg-event-prazo',
    text: 'text-event-prazo',
    border: 'border-event-prazo/40',
    dot: 'bg-event-prazo',
    cssVar: 'var(--event-prazo)',
  },
  default: {
    bgSoft: 'bg-event-default/15',
    bgSolid: 'bg-event-default',
    text: 'text-event-default',
    border: 'border-event-default/40',
    dot: 'bg-event-default',
    cssVar: 'var(--event-default)',
  },
}

/**
 * Retorna o conjunto de classes para um tipo de evento.
 * Aceita tanto o tipo canônico quanto aliases legacy (sky, amber, etc.).
 */
export function getEventColorClasses(
  type: EventType | LegacyEventColor | string | null | undefined,
): EventColorClasses {
  if (!type) return EVENT_COLOR_MAP.default

  // Legacy alias?
  if (type in LEGACY_TO_TYPE) {
    return EVENT_COLOR_MAP[LEGACY_TO_TYPE[type as LegacyEventColor]]
  }

  // Tipo canônico válido?
  if (type in EVENT_COLOR_MAP) {
    return EVENT_COLOR_MAP[type as EventType]
  }

  return EVENT_COLOR_MAP.default
}

/** Lista de tipos para iterar em pickers/legends */
export const EVENT_TYPES: ReadonlyArray<EventType> = [
  'audiencia',
  'expediente',
  'obrigacao',
  'pericia',
  'agenda',
  'prazo',
] as const

/** Labels human-readable para UI */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  audiencia: 'Audiência',
  expediente: 'Expediente',
  obrigacao: 'Obrigação',
  pericia: 'Perícia',
  agenda: 'Agenda',
  prazo: 'Prazo',
  default: 'Outro',
}
