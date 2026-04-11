/**
 * AudienciasListaView — Lista glass de audiências
 * ============================================================================
 * Glass rows com status dots (glow), badges inline (segredo, designada,
 * litisconsórcio), prep ring SVG 40px, countdown e column headers.
 * ============================================================================
 */

'use client';

import type { Audiencia } from '../../domain';
import { AudienciasGlassList } from '../audiencias-glass-list';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasListaViewProps {
  audiencias: Audiencia[];
  onViewDetail: (audiencia: Audiencia) => void;
  search?: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasListaView({
  audiencias,
  onViewDetail,
}: AudienciasListaViewProps) {
  return (
    <AudienciasGlassList
      audiencias={audiencias}
      isLoading={false}
      onView={onViewDetail}
    />
  );
}
