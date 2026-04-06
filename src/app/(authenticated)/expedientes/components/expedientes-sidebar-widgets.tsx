'use client';

/**
 * Sidebar Widgets para o Quadro de Expedientes (Sala de Situação)
 * ============================================================================
 * 3 widgets de sidebar compactos:
 * 1. RiskScoreGauge — Score composto de saúde operacional (0-100)
 * 2. AgingFunnel — Funil de envelhecimento por faixa de prazo
 * 3. ActivityHeatmap — Heatmap 5×7 dos últimos 35 dias (baixas realizadas)
 *
 * Design: GlassPanel depth=1, estética Glass Briefing
 * ============================================================================
 */

import * as React from 'react';
import { ShieldCheck, TrendingDown, Activity } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { GaugeMeter } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';

// =============================================================================
// 1. RISK SCORE GAUGE
// =============================================================================

interface RiskScoreGaugeProps {
  totalPendentes: number;
  vencidos: number;
  comResponsavel: number;
  comTipo: number;
}

function calcularRiskScore({ totalPendentes, vencidos, comResponsavel, comTipo }: RiskScoreGaugeProps): number {
  if (totalPendentes === 0) return 100;

  const pctNaoVencidos = 1 - (vencidos / totalPendentes);
  const pctComResponsavel = comResponsavel / totalPendentes;
  const pctComTipo = comTipo / totalPendentes;

  return Math.round(pctNaoVencidos * 40 + pctComResponsavel * 30 + pctComTipo * 30);
}

function getScoreStatus(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'danger';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Operacao saudavel';
  if (score >= 60) return 'Atencao pontual necessaria';
  if (score >= 40) return 'Risco operacional moderado';
  return 'Estado critico — acao imediata';
}

export function RiskScoreGauge(props: RiskScoreGaugeProps) {
  const score = calcularRiskScore(props);
  const status = getScoreStatus(score);
  const label = getScoreLabel(score);

  return (
    <GlassPanel depth={1} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Saude</p>
          <h2 className="mt-1 text-sm font-semibold">Score operacional</h2>
        </div>
        <ShieldCheck className="size-4 text-muted-foreground/45" />
      </div>

      <div className="mt-4 flex flex-col items-center">
        <GaugeMeter value={score} max={100} status={status} size={120} />
        <p className={cn(
          'mt-2 text-center text-[11px] font-medium',
          status === 'good' && 'text-success/70',
          status === 'warning' && 'text-warning/70',
          status === 'danger' && 'text-destructive/70',
        )}>
          {label}
        </p>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// 2. AGING FUNNEL
// =============================================================================

interface AgingFunnelProps {
  vencidos: number;
  hoje: number;
  tresDias: number;
  seteDias: number;
  quinzeMais: number;
  onFaixaClick?: (faixa: string) => void;
}

const FAIXAS = [
  { key: 'vencidos', label: 'Vencidos', color: 'bg-destructive' },
  { key: 'hoje', label: 'Hoje', color: 'bg-amber-500' },
  { key: 'tresDias', label: '1-3 dias', color: 'bg-primary' },
  { key: 'seteDias', label: '4-7 dias', color: 'bg-info' },
  { key: 'quinzeMais', label: '8+ dias', color: 'bg-muted-foreground' },
] as const;

export function AgingFunnel({
  vencidos,
  hoje,
  tresDias,
  seteDias,
  quinzeMais,
  onFaixaClick,
}: AgingFunnelProps) {
  const valores: Record<string, number> = {
    vencidos,
    hoje,
    tresDias,
    seteDias,
    quinzeMais,
  };
  const maximo = Math.max(...Object.values(valores), 1);

  return (
    <GlassPanel depth={1} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Distribuicao</p>
          <h2 className="mt-1 text-sm font-semibold">Funil de prazos</h2>
        </div>
        <TrendingDown className="size-4 text-muted-foreground/45" />
      </div>

      <div className="mt-4 space-y-2.5">
        {FAIXAS.map((faixa) => {
          const valor = valores[faixa.key];
          const pct = maximo > 0 ? (valor / maximo) * 100 : 0;

          return (
            <button
              key={faixa.key}
              type="button"
              onClick={() => onFaixaClick?.(faixa.key)}
              className={cn(
                'w-full text-left group transition-all duration-150',
                onFaixaClick && 'cursor-pointer hover:opacity-80',
                !onFaixaClick && 'cursor-default',
              )}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[11px] text-muted-foreground/70 truncate">{faixa.label}</span>
                <span className="text-[11px] font-semibold tabular-nums">{valor}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border/10 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    `${faixa.color}/40`,
                  )}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// 3. ACTIVITY HEATMAP (últimos 35 dias)
// =============================================================================

interface ActivityHeatmapProps {
  /** Map de data ISO (YYYY-MM-DD) → contagem de baixas */
  baixasPorDia: Map<string, number>;
}

function gerarDias35(): string[] {
  const dias: string[] = [];
  const hoje = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
}

function getIntensidade(valor: number): string {
  if (valor === 0) return 'bg-border/[0.06]';
  if (valor <= 2) return 'bg-primary/15';
  if (valor <= 5) return 'bg-primary/30';
  if (valor <= 10) return 'bg-primary/50';
  return 'bg-primary/80';
}

export function ActivityHeatmap({ baixasPorDia }: ActivityHeatmapProps) {
  const dias = React.useMemo(() => gerarDias35(), []);
  const totalBaixas = React.useMemo(() => {
    let total = 0;
    baixasPorDia.forEach((v) => { total += v; });
    return total;
  }, [baixasPorDia]);

  const mediaDiaria = dias.length > 0 ? (totalBaixas / dias.length).toFixed(1) : '0';

  return (
    <GlassPanel depth={1} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Atividade</p>
          <h2 className="mt-1 text-sm font-semibold">Baixas 35 dias</h2>
        </div>
        <Activity className="size-4 text-muted-foreground/45" />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-0.75">
        {dias.map((dia) => {
          const valor = baixasPorDia.get(dia) ?? 0;
          return (
            <div
              key={dia}
              title={`${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(dia + 'T12:00:00'))} — ${valor} baixa(s)`}
              className={cn(
                'aspect-square rounded-sm transition-colors duration-200',
                getIntensidade(valor),
              )}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/45">
        <span>{totalBaixas} baixas no periodo</span>
        <span>media {mediaDiaria}/dia</span>
      </div>
    </GlassPanel>
  );
}
