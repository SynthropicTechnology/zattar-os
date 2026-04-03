'use client';

/**
 * KanbanColumn — Coluna de kanban para um estágio do pipeline de contratos.
 *
 * Extraído do KanbanColumn do mock de contratos.
 * Exibe header com contagem + total financeiro e lista de ContratoCard.
 *
 * Uso:
 *   <KanbanColumn
 *     stage={{ id: 'contratado', label: 'Contratado', color: 'hsl(var(--primary))' }}
 *     contratos={contratos}
 *   />
 */

import { fmtMoeda } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { ContratoCard } from './contrato-card';
import type { ContratoCardData } from './contrato-card';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanColumnProps {
  stage: { id: string; label: string; color: string };
  contratos: ContratoCardData[];
  onCardClick?: (c: ContratoCardData) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KanbanColumn({ stage, contratos, onCardClick }: KanbanColumnProps) {
  const total = contratos.reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="flex-1 min-w-65 flex flex-col gap-2">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-1 pb-2 border-b-2"
        style={{ borderColor: stage.color }}
      >
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-semibold">{stage.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/10 text-muted-foreground/50 tabular-nums">
            {contratos.length}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums font-medium">
          {fmtMoeda(total)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {contratos.map((c) => (
          <ContratoCard
            key={c.id}
            contrato={c}
            stageColor={stage.color}
            onClick={onCardClick}
          />
        ))}
        {contratos.length === 0 && (
          <div className="py-8 text-center text-[10px] text-muted-foreground/50">
            Nenhum contrato
          </div>
        )}
      </div>
    </div>
  );
}
