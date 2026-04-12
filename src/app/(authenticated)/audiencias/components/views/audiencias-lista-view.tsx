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
  search,
}: AudienciasListaViewProps) {
  const filtered = search
    ? audiencias.filter((a) =>
        [a.tipoDescricao, a.numeroProcesso, a.poloAtivoNome, a.poloPassivoNome]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(search.toLowerCase()))
      )
    : audiencias;

  return (
    <AudienciasGlassList
      audiencias={filtered}
      isLoading={false}
      onView={onViewDetail}
    />
  );
}
