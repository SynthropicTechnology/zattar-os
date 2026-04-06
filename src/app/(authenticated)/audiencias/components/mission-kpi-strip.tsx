/**
 * MissionKpiStrip — Cards de KPIs para o módulo de audiências
 * ============================================================================
 * Segue o padrão PulseStrip de processos: grid de cards individuais com
 * GlassPanel, ícone no canto e visual secundário por card.
 *
 * 4 cards: Semana | Próxima | Realizadas | Preparo
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import { CalendarDays, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { parseISO, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  Sparkline,
  AnimatedNumber,
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
    const relevantesMes = thisMonth.filter(
      (a) => a.status === StatusAudiencia.Marcada || a.status === StatusAudiencia.Finalizada,
    ).length;
    const taxaRealizacao = relevantesMes > 0 ? Math.round((realizadasMes / relevantesMes) * 100) : 0;

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

    // Trend: count by last 6 months (only marcadas + finalizadas)
    const relevantes = audiencias.filter(
      (a) => a.status === StatusAudiencia.Marcada || a.status === StatusAudiencia.Finalizada,
    );
    const trend: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = relevantes.filter((a) => {
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
      relevantesMes,
      taxaRealizacao,
      avgPrep,
      trend,
    };
  }, [audiencias, now]);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}>
      {/* ── Semana ─────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Semana
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.totalSemana} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">audiências</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <CalendarDays className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        {/* Sparkline de tendência 6m */}
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={stats.trend.length >= 2 ? stats.trend : [0, 0]} width={80} height={16} />
          {stats.trend.length >= 2 && stats.trend[0] > 0 && (
            <span className={`text-[9px] font-medium tabular-nums ${
              stats.trend[stats.trend.length - 1] >= stats.trend[0] ? 'text-success/60' : 'text-destructive/60'
            }`}>
              {`${stats.trend[stats.trend.length - 1] >= stats.trend[0] ? '+' : ''}${Math.round(((stats.trend[stats.trend.length - 1] - stats.trend[0]) / stats.trend[0]) * 100)}%`}
            </span>
          )}
        </div>
      </GlassPanel>

      {/* ── Próxima ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Próxima
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {stats.nextLabel}
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <Clock className="size-4 text-warning/50" />
          </IconContainer>
        </div>
        {/* Detalhe do tribunal + modalidade */}
        <div className="mt-2.5">
          {stats.nextDetail ? (
            <span className="text-[9px] text-muted-foreground/50 truncate block">
              {stats.nextDetail}
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground/30">Nenhuma agendada</span>
          )}
        </div>
      </GlassPanel>

      {/* ── Realizadas ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Realizadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.realizadasMes} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">/ {stats.relevantesMes} mês</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <CheckCircle2 className="size-4 text-success/50" />
          </IconContainer>
        </div>
        {/* Barra de taxa de realização */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${stats.taxaRealizacao}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.taxaRealizacao}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Preparo ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Preparo
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {stats.avgPrep}%
              </p>
              <span className="text-[10px] text-muted-foreground/40">média</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <ShieldCheck className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        {/* Barra de preparo com cor dinâmica */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.avgPrep}%`,
                backgroundColor: getPrepColor(stats.avgPrep),
                opacity: 0.3,
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.avgPrep}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
