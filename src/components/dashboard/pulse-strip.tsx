/**
 * PulseStrip — Barra de estatísticas rápidas (totalizadores por categoria)
 * ============================================================================
 * Exibe uma linha horizontal com ícone, total e delta opcional por item.
 * Adequado para resumo de entidades: clientes, partes contrárias, etc.
 *
 * USO:
 *   <PulseStrip items={[
 *     { label: 'Clientes', total: 142, delta: '+5', icon: User, color: 'text-primary' },
 *   ]} />
 * ============================================================================
 */

'use client';

import { type LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/app/app/dashboard/mock/widgets/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PulseItem {
  label: string;
  total: number;
  delta?: string;  // e.g. "+5"
  icon: LucideIcon;
  color: string;   // e.g. 'text-primary'
}

interface PulseStripProps {
  items: PulseItem[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PulseStrip({ items }: PulseStripProps) {
  return (
    <GlassPanel className="px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3 shrink-0">
            {i > 0 && <div className="w-px h-8 bg-border/10 -ml-3" />}
            <item.icon className={`size-4 ${item.color}/40`} />
            <div>
              <p className="font-display text-lg font-bold tabular-nums">{item.total}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {item.label}
                {item.delta && (
                  <span className="text-success/60 ml-1">{item.delta}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
