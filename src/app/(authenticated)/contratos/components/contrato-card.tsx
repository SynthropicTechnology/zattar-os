'use client';

/**
 * ContratoCard — Card de vidro para um contrato individual.
 *
 * Extraído do KanbanCard do mock de contratos.
 * Usado em visualizações kanban e pipeline.
 *
 * Uso:
 *   <ContratoCard contrato={c} stageColor="hsl(var(--primary))" onClick={handleClick} />
 */

import { Clock, Building2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { fmtMoeda } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratoCardData {
  id: number;
  cliente: string;
  clienteTipo: 'pf' | 'pj';
  parteContraria?: string;
  tipo: string;
  cobranca: string;
  segmento: string;
  status: string;
  valor: number;
  cadastradoEm: string;
  responsavel: string;
  diasNoEstagio: number;
  processosVinculados: number;
}

export interface ContratoCardProps {
  contrato: ContratoCardData;
  stageColor?: string;
  onClick?: (c: ContratoCardData) => void;
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

export function ContratoCard({ contrato: c, stageColor, onClick }: ContratoCardProps) {
  const isStuck = c.diasNoEstagio > 30;

  return (
    <GlassPanel
      className={`p-3 cursor-pointer hover:scale-[1.01] transition-transform relative ${isStuck ? 'ring-1 ring-warning/20' : ''}`}
    >
      {/* Clickable overlay */}
      <button
        type="button"
        className="absolute inset-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 outline-none"
        aria-label={`Ver contrato de ${c.cliente}`}
        onClick={() => onClick?.(c)}
      />
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <IconContainer size="md" className="bg-primary/8">
          {c.clienteTipo === 'pj' ? (
            <Building2 className="size-3.5 text-primary/60" />
          ) : (
            <span className="text-[9px] font-bold text-primary/60">{getInitials(c.cliente)}</span>
          )}
        </IconContainer>

        <div className="flex-1 min-w-0">
          {/* Client name */}
          <p className="text-[11px] font-semibold truncate leading-tight">{c.cliente}</p>
          {c.parteContraria && (
            <p className="text-[9px] text-muted-foreground/55 truncate">vs. {c.parteContraria}</p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/6 text-primary/50">
              {c.tipo}
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-border/10 text-muted-foreground/60">
              {c.cobranca}
            </span>
            {c.processosVinculados > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-info/6 text-info/50">
                {c.processosVinculados} proc.
              </span>
            )}
          </div>

          {/* Bottom: valor + dias */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-bold tabular-nums text-primary/70">
              {fmtMoeda(c.valor)}
            </span>
            <span
              className={`text-[9px] flex items-center gap-0.5 ${
                isStuck ? 'text-warning/60' : 'text-muted-foreground/55'
              }`}
            >
              <Clock className="size-2.5" />
              {c.diasNoEstagio}d
            </span>
          </div>
        </div>
      </div>

      {/* Stage color accent */}
      {stageColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-40"
          style={{ backgroundColor: stageColor }}
        />
      )}
    </GlassPanel>
  );
}
