'use client';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrendInfo {
  valor: string;
  texto: string;
  tipo: 'up' | 'down' | 'neutral';
}

interface ProgressBarInfo {
  valor: number;
  max: number;
}

interface BadgeInfo {
  texto: string;
  cor: string;
}

export interface GazetteKpiCardProps {
  label: string;
  value: number;
  trend?: TrendInfo;
  sparkline?: number[];
  progressBar?: ProgressBarInfo;
  isActive?: boolean;
  isDanger?: boolean;
  badge?: BadgeInfo;
  onClick?: () => void;
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-0.5 h-6 w-full mt-2" aria-hidden>
      {data.map((val, i) => {
        const heightPct = Math.max((val / max) * 100, 8);
        return (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/30 transition-all duration-300"
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ valor, max }: ProgressBarInfo) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0;
  return (
    <div className="mt-2 w-full">
      <div className="h-1 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Trend Icon ───────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: TrendInfo }) {
  const Icon =
    trend.tipo === 'up'
      ? TrendingUp
      : trend.tipo === 'down'
        ? TrendingDown
        : Minus;

  const colorClass =
    trend.tipo === 'up'
      ? 'text-success'
      : trend.tipo === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <span className={cn('flex items-center gap-0.5', colorClass)}>
      <Icon className="size-3" aria-hidden />
      <Text variant="micro-caption" className={colorClass}>
        {trend.valor}
      </Text>
    </span>
  );
}

// ─── GazetteKpiCard ──────────────────────────────────────────────────────────

export function GazetteKpiCard({
  label,
  value,
  trend,
  sparkline,
  progressBar,
  isActive = false,
  isDanger = false,
  badge,
  onClick,
}: GazetteKpiCardProps) {
  const depth = isActive ? 3 : 2;

  return (
    <div
      className={cn(
        'cursor-pointer select-none transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
    <GlassPanel
      depth={depth}
      className={cn(
        'relative p-3 overflow-hidden h-full',
        isActive && 'border-t-2 border-t-primary',
        isDanger && !isActive && 'bg-destructive/4',
      )}
    >
      {/* Label */}
      <Text
        variant="meta-label"
        className={cn(
          'uppercase tracking-wide truncate block',
          isDanger ? 'text-destructive/80' : 'text-muted-foreground',
        )}
      >
        {label}
      </Text>

      {/* Value + Trend row */}
      <div className="flex items-end justify-between mt-1 gap-1">
        <Text
          variant="kpi-value"
          className={cn(
            'leading-none',
            isDanger && 'text-destructive',
            isActive && 'text-primary',
          )}
        >
          {value.toLocaleString('pt-BR')}
        </Text>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && <Sparkline data={sparkline} />}

      {/* Progress bar */}
      {progressBar && <ProgressBar valor={progressBar.valor} max={progressBar.max} />}

      {/* Badge */}
      {badge && (
        <Text
          variant="micro-caption"
          className={cn('block mt-1.5 truncate', badge.cor)}
        >
          {badge.texto}
        </Text>
      )}
    </GlassPanel>
    </div>
  );
}
