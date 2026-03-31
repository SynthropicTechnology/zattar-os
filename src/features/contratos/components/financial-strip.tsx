'use client';

/**
 * FinancialStrip — Faixa de KPIs financeiros de contratos.
 *
 * Extraído do FinancialStrip do mock de contratos.
 * Mostra carteira, ticket médio, taxa de conversão e tendência.
 * Valores financeiros opcionais exibidos como "---" quando indisponíveis (v1).
 *
 * Uso:
 *   <FinancialStrip stats={stats} />
 */

import { DollarSign } from 'lucide-react';
import {
  GlassPanel,
  fmtMoeda,
  AnimatedNumber,
  ProgressRing,
  Sparkline,
} from '@/app/app/dashboard/mock/widgets/primitives';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratosStatsData {
  total: number;
  novosMes: number;
  taxaConversao: number;
  trendMensal: number[];
  emCarteira?: number;
  ticketMedio?: number;
}

export interface FinancialStripProps {
  stats: ContratosStatsData;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinancialStrip({ stats }: FinancialStripProps) {
  return (
    <GlassPanel className="px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* Em Carteira */}
        <div className="flex items-center gap-2 shrink-0">
          <DollarSign className="size-4 text-muted-foreground/30" />
          <div>
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
              Em Carteira
            </p>
            {stats.emCarteira !== undefined ? (
              <p className="font-display text-lg font-bold tabular-nums">
                <AnimatedNumber value={stats.emCarteira} prefix="R$ " duration={1200} />
              </p>
            ) : (
              <p className="font-display text-lg font-bold tabular-nums text-muted-foreground/25">
                ---
              </p>
            )}
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Ticket Médio */}
        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Ticket Médio
          </p>
          {stats.ticketMedio !== undefined ? (
            <p className="font-display text-base font-bold tabular-nums">
              {fmtMoeda(stats.ticketMedio)}
            </p>
          ) : (
            <p className="font-display text-base font-bold tabular-nums text-muted-foreground/25">
              ---
            </p>
          )}
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Taxa de Conversão */}
        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Conversão
          </p>
          <div className="flex items-center gap-2">
            <ProgressRing
              percent={stats.taxaConversao}
              size={32}
              color="hsl(var(--success))"
            />
            <span className="text-xs font-bold text-success/70">{stats.taxaConversao}%</span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tendência 6m */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
              Tendência 6m
            </p>
            <p className="text-xs font-semibold text-success/60">
              {stats.novosMes > 0 ? `+${stats.novosMes}` : stats.novosMes} este mês
            </p>
          </div>
          {stats.trendMensal.length > 0 && (
            <Sparkline
              data={stats.trendMensal}
              width={60}
              height={20}
              color="hsl(var(--success))"
            />
          )}
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Total */}
        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Total</p>
          <p className="font-display text-lg font-bold tabular-nums">
            <AnimatedNumber value={stats.total} duration={800} />
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
