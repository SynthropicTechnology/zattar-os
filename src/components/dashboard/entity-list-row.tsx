/**
 * EntityListRow — Linha compacta de entidade para visualização em lista
 * ============================================================================
 * Versão condensada do EntityCard: avatar, nome, documento, tipo, estado,
 * contagem de processos e tempo desde última atualização em uma linha.
 *
 * USO:
 *   <EntityListRow
 *     data={entityData}
 *     onClick={(d) => setSelected(d)}
 *     selected={selected?.id === entityData.id}
 *   />
 * ============================================================================
 */

'use client';

import { Building2, ChevronRight } from 'lucide-react';
import { type EntityCardData } from '@/components/dashboard/entity-card';
import { getInitials, timeAgo } from '@/components/dashboard/entity-card';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EntityListRowProps {
  data: EntityCardData;
  onClick?: (data: EntityCardData) => void;
  selected?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EntityListRow({ data, onClick, selected = false }: EntityListRowProps) {
  const { config } = data;

  return (
    <div
      onClick={() => onClick?.(data)}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150
        ${selected
          ? 'bg-primary/[0.06] border border-primary/15'
          : 'hover:bg-white/4 border border-transparent'
        }
      `}
    >
      {/* Avatar */}
      <div className={`size-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
        {data.tipo === 'pj' ? (
          <Building2 className={`size-3.5 ${config.color}`} />
        ) : (
          <span className={`text-[10px] font-bold ${config.color}`}>{getInitials(data.nome)}</span>
        )}
      </div>

      {/* Nome + documento */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{data.nome}</p>
        <p className="text-[10px] text-muted-foreground/35 tabular-nums">{data.documentoMasked}</p>
      </div>

      {/* Tipo */}
      <span
        className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color} shrink-0 hidden sm:block`}
      >
        {config.label}
      </span>

      {/* Localização */}
      <span className="text-[10px] text-muted-foreground/35 shrink-0 hidden md:block w-16 text-right">
        {data.localizacao.split(', ').at(-1)}
      </span>

      {/* Processos */}
      <span className="text-[10px] font-medium tabular-nums shrink-0 w-12 text-right">
        {data.metricas.ativos}
        <span className="text-muted-foreground/25"> proc</span>
      </span>

      {/* Tempo */}
      <span className="text-[9px] text-muted-foreground/25 shrink-0 w-14 text-right hidden lg:block">
        {timeAgo(data.ultimaAtualizacao)}
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </div>
  );
}
