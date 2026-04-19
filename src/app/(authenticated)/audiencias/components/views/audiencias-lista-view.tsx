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

interface UsuarioOption {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

export interface AudienciasListaViewProps {
  audiencias: Audiencia[];
  onViewDetail: (audiencia: Audiencia) => void;
  search?: string;
  usuarios: UsuarioOption[];
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasListaView({
  audiencias,
  onViewDetail,
  search,
  usuarios,
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
      usuarios={usuarios}
    />
  );
}
