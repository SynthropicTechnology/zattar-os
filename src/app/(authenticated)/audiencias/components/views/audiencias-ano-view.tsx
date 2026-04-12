/**
 * AudienciasAnoView — Year heatmap GitHub-style em GlassPanel
 * ============================================================================
 * Heatmap 12-meses (4x3) com 4 níveis de intensidade, tooltips por cell,
 * legenda estilo GitHub, sidebar com 5 stat cards e diálogo de dia.
 * ============================================================================
 */

'use client';

import type { Audiencia } from '../../domain';
import { AudienciasYearHeatmap } from '../audiencias-year-heatmap';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasAnoViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasAnoView({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasAnoViewProps) {
  return (
    <AudienciasYearHeatmap
      audiencias={audiencias}
      currentDate={currentDate}
      onDateChange={onDateChange}
      refetch={refetch}
    />
  );
}
