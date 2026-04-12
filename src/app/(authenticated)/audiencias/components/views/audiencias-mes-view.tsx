/**
 * AudienciasMesView — Calendário mensal Glass Briefing
 * ============================================================================
 * Calendário GlassPanel com dots coloridos de status, count badges para 3+,
 * popover com lista de audiências ao clicar no dia, e summary strip no footer.
 * ============================================================================
 */

'use client';

import type { Audiencia } from '../../domain';
import { AudienciasGlassMonth } from '../audiencias-glass-month';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasMesViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasMesView({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasMesViewProps) {
  return (
    <AudienciasGlassMonth
      audiencias={audiencias}
      currentMonth={currentDate}
      onMonthChange={onDateChange}
      refetch={refetch}
    />
  );
}
