/**
 * MissionKpiStrip — Faixa de KPIs para o módulo de audiências
 * ============================================================================
 * Segue o padrão FinancialStrip de contratos: GlassPanel depth=2,
 * flex horizontal com dividers, AnimatedNumber, ProgressRing, Sparkline.
 *
 * Calcula stats a partir do array de audiências real.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { parseISO, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  GlassPanel,
  Sparkline,
  AnimatedNumber,
  ProgressRing,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { calcPrepItems, calcPrepScore } from './prep-score';

// ─── Types ────────────────────────────────────────────────────────────────

export interface MissionKpiStripProps {
  audiencias: Audiencia[];
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPrepColor(score: number): string {
  if (score >= 80) return 'hsl(var(--success))';
  if (score >= 50) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

function getTimeUntilLabel(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return 'Agora';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// ─── Component ────────────────────────────────────────────────────────────

export function MissionKpiStrip({ audiencias, className }: MissionKpiStripProps) {
  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const thisWeek = audiencias.filter((a) => {
      try {
        return isSameWeek(parseISO(a.dataInicio), now, { locale: ptBR, weekStartsOn: 1 });
      } catch {
        return false;
      }
    });

    const thisMonth = audiencias.filter((a) => {
      try {
        return isSameMonth(parseISO(a.dataInicio), now);
      } catch {
        return false;
      }
    });

    const marcadasSemana = thisWeek.filter((a) => a.status === StatusAudiencia.Marcada);
    const realizadasMes = thisMonth.filter((a) => a.status === StatusAudiencia.Finalizada).length;
    const totalMes = thisMonth.length;
    const taxaRealizacao = totalMes > 0 ? Math.round((realizadasMes / totalMes) * 100) : 0;

    // Next upcoming
    const upcoming = audiencias
      .filter((a) => {
        try {
          return a.status === StatusAudiencia.Marcada && parseISO(a.dataFim) > now;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
    const next = upcoming[0] ?? null;

    // Avg prep
    const marcadas = audiencias.filter((a) => a.status === StatusAudiencia.Marcada);
    const avgPrep = marcadas.length > 0
      ? Math.round(marcadas.reduce((acc, a) => acc + calcPrepScore(calcPrepItems(a)), 0) / marcadas.length)
      : 0;

    // Trend: count by last 6 months (simplified)
    const trend: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = audiencias.filter((a) => {
        try {
          const ad = parseISO(a.dataInicio);
          return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        } catch {
          return false;
        }
      }).length;
      trend.push(count);
    }

    return {
      totalSemana: marcadasSemana.length,
      next,
      nextLabel: next ? getTimeUntilLabel(parseISO(next.dataInicio)) : '—',
      nextDetail: next ? `${next.trt ?? ''} · ${next.modalidade === 'virtual' ? 'Virtual' : next.modalidade === 'presencial' ? 'Presencial' : 'Híbrida'}` : '',
      realizadasMes,
      totalMes,
      taxaRealizacao,
      avgPrep,
      trend,
    };
  }, [audiencias, now]);

  return (
    <GlassPanel depth={2} className={`px-5 py-3 ${className ?? ''}`}>
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* Esta Semana */}
        <div className="flex items-center gap-2.5 min-w-max">
          <CalendarDays className="size-4 text-primary/30" />
          <div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Semana</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-bold tabular-nums">
                <AnimatedNumber value={stats.totalSemana} />
              </span>
              <span className="text-[9px] text-muted-foreground/40">audiências</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Próxima */}
        <div className="flex items-center gap-2.5 min-w-max">
          <Clock className="size-4 text-warning/30" />
          <div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Próxima</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold tabular-nums">
                {stats.nextLabel}
              </span>
              {stats.nextDetail && (
                <span className="text-[9px] text-muted-foreground/40">{stats.nextDetail}</span>
              )}
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Realizadas Mês */}
        <div className="flex items-center gap-2.5 min-w-max">
          <ProgressRing percent={stats.taxaRealizacao} size={32} color="hsl(var(--success))" />
          <div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Realizadas</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-bold tabular-nums">
                <AnimatedNumber value={stats.realizadasMes} />
              </span>
              <span className="text-[9px] text-muted-foreground/40">/ {stats.totalMes} mês</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Preparo Médio */}
        <div className="flex items-center gap-2.5 min-w-max">
          <ProgressRing
            percent={stats.avgPrep}
            size={32}
            color={getPrepColor(stats.avgPrep)}
          />
          <div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Preparo</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-bold tabular-nums">{stats.avgPrep}%</span>
              <span className="text-[9px] text-muted-foreground/40">média</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tendência */}
        <div className="flex items-center gap-2.5 min-w-max">
          <div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Tendência 6m</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Sparkline data={stats.trend.length >= 2 ? stats.trend : [0, 0]} width={60} height={20} />
              {stats.trend.length >= 2 && stats.trend[0] > 0 && (
                <span className={`text-[9px] font-medium ${
                  stats.trend[stats.trend.length - 1] >= stats.trend[0] ? 'text-success/60' : 'text-destructive/60'
                }`}>
                  {stats.trend[0] > 0
                    ? `${stats.trend[stats.trend.length - 1] >= stats.trend[0] ? '+' : ''}${Math.round(((stats.trend[stats.trend.length - 1] - stats.trend[0]) / stats.trend[0]) * 100)}%`
                    : '—'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
