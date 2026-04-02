/**
 * AudienciasListaView — Lista flat de audiências com AudienciaListRow
 * ============================================================================
 * Componente puramente presentacional. Recebe array filtrado e renderiza
 * linhas no padrão Glass Briefing (ContratoListRow).
 * ============================================================================
 */

'use client';

import { Gavel } from 'lucide-react';
import type { Audiencia } from '../../domain';
import { AudienciaListRow } from '../audiencia-list-row';

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
  if (audiencias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Gavel className="size-8 text-muted-foreground/45 mb-3" />
        <p className="text-sm font-medium text-muted-foreground/50">Nenhuma audiência encontrada</p>
        <p className="text-xs text-muted-foreground/55 mt-1">
          {search ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {audiencias.map((a) => (
        <AudienciaListRow key={a.id} audiencia={a} onClick={onViewDetail} />
      ))}
    </div>
  );
}
