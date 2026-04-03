'use client';

/**
 * ContratoListRow — Linha compacta para visualização em lista de contratos.
 *
 * Extraído do ContratoListRow do mock de contratos.
 * Exibe: status dot, avatar, nome, parte contrária, tipo, estágio, valor, dias.
 *
 * Uso:
 *   <ContratoListRow contrato={c} onClick={handleClick} />
 */

import { ChevronRight, Building2 } from 'lucide-react';
import { fmtMoeda } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { ContratoCardData } from './contrato-card';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratoListRowProps {
  contrato: ContratoCardData;
  stageColor?: string;
  stageLabel?: string;
  onClick?: (c: ContratoCardData) => void;
  selected?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContratoListRow({
  contrato: c,
  stageColor,
  stageLabel,
  onClick,
  selected,
}: ContratoListRowProps) {
  const isStuck = c.diasNoEstagio > 30;

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={() => onClick?.(c)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(c)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary/30 ${
        selected ? 'bg-primary/6' : 'hover:bg-white/4'
      } ${isStuck ? 'ring-1 ring-warning/10' : ''}`}
    >
      {/* Status dot */}
      <div
        className="size-2.5 rounded-full shrink-0"
        style={{ backgroundColor: stageColor ?? 'hsl(var(--muted-foreground))', opacity: 0.6 }}
      />

      {/* Avatar */}
      <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        {c.clienteTipo === 'pj' ? (
          <Building2 className="size-3.5 text-primary/60" />
        ) : (
          <span className="text-[9px] font-bold text-primary/60">{getInitials(c.cliente)}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{c.cliente}</p>
        {c.parteContraria && (
          <p className="text-[10px] text-muted-foreground/55 truncate">vs. {c.parteContraria}</p>
        )}
      </div>

      {/* Type tag */}
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/6 text-primary/50 shrink-0 hidden sm:block">
        {c.tipo}
      </span>

      {/* Stage label */}
      {stageLabel && (
        <span
          className="text-[9px] font-medium shrink-0 hidden md:block w-24 text-right"
          style={{ color: stageColor }}
        >
          {stageLabel}
        </span>
      )}

      {/* Value */}
      <span className="text-[11px] font-bold tabular-nums shrink-0 w-24 text-right">
        {fmtMoeda(c.valor)}
      </span>

      {/* Days */}
      <span
        className={`text-[9px] shrink-0 w-10 text-right ${
          isStuck ? 'text-warning/60' : 'text-muted-foreground/50'
        }`}
      >
        {c.diasNoEstagio}d
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}
