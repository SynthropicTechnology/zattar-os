'use client';

import { useMemo } from 'react';
import { Target, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import {
  Sparkline,
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { Pericia } from '../domain';
import { SituacaoPericiaCodigo } from '../domain';

// Função de mock analítico copiada do client
function getRandomScore(seed: number) {
  const rs = Math.sin(seed) * 10000;
  return rs - Math.floor(rs);
}

function calcPeritoInsights(idStr: string | number) {
  const num = typeof idStr === 'number' ? idStr : parseInt(String(idStr).replace(/\D/g, '') || '0');
  const winRate = Math.floor(40 + (getRandomScore(num + 1) * 55));
  const missingDeposit = getRandomScore(num + 2) > 0.7; // 30% chance
  const honorariosVal = Math.floor(10 + getRandomScore(num + 3) * 50) * 100;
  return { winRate, missingDeposit, honorariosVal };
}

export interface PericiasKpiStripProps {
  pericias: Pericia[];
  className?: string;
}

export function PericiasKpiStrip({ pericias, className }: PericiasKpiStripProps) {
  const stats = useMemo(() => {
    let totalDepositados = 0;
    let totalPendentes = 0;
    let winCount = 0;
    let prazosCriticos = 0;

    const noPrazos = new Date();
    noPrazos.setDate(noPrazos.getDate() + 7);

    pericias.forEach((p) => {
      const insights = calcPeritoInsights(p.id);
      
      if (insights.missingDeposit) {
        totalPendentes += insights.honorariosVal;
      } else {
        totalDepositados += insights.honorariosVal;
      }
      if (insights.winRate > 60) winCount++;
      if (p.prazoEntrega && new Date(p.prazoEntrega) <= noPrazos) {
        prazosCriticos++;
      }
    });

    const ativas = pericias.filter(
      (p) =>
        p.situacaoCodigo !== SituacaoPericiaCodigo.FINALIZADA &&
        p.situacaoCodigo !== SituacaoPericiaCodigo.CANCELADA
    ).length;

    const winR = pericias.length ? Math.round((winCount / pericias.length) * 100) : 0;

    // Fake trend for Sparkline
    const trendAtivas = [Math.max(0, ativas - 5), Math.max(0, ativas - 2), ativas - 1, ativas + 2, ativas];
    const trendCriticos = [Math.max(0, prazosCriticos + 5), Math.max(0, prazosCriticos + 2), prazosCriticos - 1, prazosCriticos + 1, prazosCriticos];

    return {
      ativas,
      pendentes: totalPendentes,
      winRate: winR,
      criticos: prazosCriticos,
      trendAtivas,
      trendCriticos
    };
  }, [pericias]);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}>
      {/* ── Perícias Ativas ─────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Perícias Ativas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.ativas} />
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <Target className="size-4 text-primary/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={stats.trendAtivas} width={80} height={16} />
          <span className="text-[9px] font-medium tabular-nums text-success/60">
            +{(stats.trendAtivas[stats.trendAtivas.length - 1] - stats.trendAtivas[0] > 0 ? '+' : '')}
            {stats.trendAtivas[stats.trendAtivas.length - 1] - stats.trendAtivas[0]}
          </span>
        </div>
      </GlassPanel>

      {/* ── Honorários Pendentes ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Honorários
            </p>
            <div className="flex items-baseline gap-1.5 mt-1 truncate max-w-full overflow-hidden">
              <p className="font-display text-xl font-bold tabular-nums leading-none text-orange-500 whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="text-sm">R$</span> <AnimatedNumber value={stats.pendentes} />
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <DollarSign className="size-4 text-warning/50" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-[9px] text-muted-foreground/50 truncate block uppercase tracking-wider">
            Pagamentos em Risco
          </span>
        </div>
      </GlassPanel>

      {/* ── Favorabilidade ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Favorabilidade
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.winRate} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">% teses</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4 text-success/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.winRate}% avg
          </span>
        </div>
      </GlassPanel>

      {/* ── Prazos Críticos ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Prazos Críticos
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none text-destructive">
                <AnimatedNumber value={stats.criticos} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">em 7d</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-destructive/8 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4 text-destructive/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={stats.trendCriticos} width={80} height={16} />
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0 uppercase tracking-wider">
            Volume de entregas
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
