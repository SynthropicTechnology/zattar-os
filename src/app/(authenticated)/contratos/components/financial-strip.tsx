'use client';

/**
 * FinancialStrip — Cards de KPIs financeiros de contratos.
 * ============================================================================
 * Segue o padrão MissionKpiStrip de audiências: grid de cards individuais com
 * GlassPanel, ícone no canto e visual secundário por card.
 *
 * 5 cards: Em Carteira | Ticket Médio | Conversão | Tendência | Total
 * ============================================================================
 */

import { DollarSign, Receipt, TrendingUp, BarChart3, FileText } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  AnimatedNumber,
  Sparkline,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { fmtMoeda } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { ContratosStatsData } from '../domain';

export type { ContratosStatsData };

export interface FinancialStripProps {
  stats: ContratosStatsData;
}

export function FinancialStrip({ stats }: FinancialStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* ── Em Carteira ──────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Em Carteira
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              {stats.emCarteira !== undefined ? (
                <p className="font-display text-xl font-bold tabular-nums leading-none">
                  <AnimatedNumber value={stats.emCarteira} prefix="R$ " duration={1200} />
                </p>
              ) : (
                <p className="font-display text-xl font-bold tabular-nums leading-none text-muted-foreground/50">
                  ---
                </p>
              )}
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <DollarSign className="size-4 text-primary/50" />
          </IconContainer>
        </div>
      </GlassPanel>

      {/* ── Ticket Médio ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Ticket Médio
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              {stats.ticketMedio !== undefined ? (
                <p className="font-display text-xl font-bold tabular-nums leading-none">
                  {fmtMoeda(stats.ticketMedio)}
                </p>
              ) : (
                <p className="font-display text-xl font-bold tabular-nums leading-none text-muted-foreground/50">
                  ---
                </p>
              )}
            </div>
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <Receipt className="size-4 text-warning/50" />
          </IconContainer>
        </div>
      </GlassPanel>

      {/* ── Conversão ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Conversão
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {stats.taxaConversao}%
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <TrendingUp className="size-4 text-success/50" />
          </IconContainer>
        </div>
        {/* Barra de conversão */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${stats.taxaConversao}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.taxaConversao}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Tendência 6m ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Tendência
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {stats.novosMes > 0 ? `+${stats.novosMes}` : stats.novosMes}
              </p>
              <span className="text-[10px] text-muted-foreground/40">este mês</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <BarChart3 className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        {/* Sparkline de tendência */}
        {stats.trendMensal.length >= 2 && (
          <div className="mt-2.5">
            <Sparkline data={stats.trendMensal} width={80} height={16} color="var(--success)" />
          </div>
        )}
      </GlassPanel>

      {/* ── Total ────────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Total
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.total} duration={800} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">contratos</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <FileText className="size-4 text-primary/50" />
          </IconContainer>
        </div>
      </GlassPanel>
    </div>
  );
}
