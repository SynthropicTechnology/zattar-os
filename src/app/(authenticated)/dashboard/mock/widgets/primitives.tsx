/**
 * WIDGET GALLERY — Primitivas de Design
 * ============================================================================
 * Componentes de visualização para a galeria de widgets da dashboard.
 * Seguem a estética "Glass Briefing" — vidro fumê, prioridade, compacto.
 *
 * GlassPanel e WidgetContainer agora vivem em @/components/shared/glass-panel
 * e são re-exportados daqui para retrocompatibilidade.
 *
 * USO: import { GlassPanel, Sparkline, MiniDonut, ... } from './primitives'
 * ============================================================================
 */

'use client';

import React from 'react';

// ─── Re-export: Glass Panel & Widget Container ─────────────────────────
// Canonical location: @/components/shared/glass-panel
export { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
export type { GlassPanelProps, WidgetContainerProps } from '@/components/shared/glass-panel';

// ─── Sparkline SVG ──────────────────────────────────────────────────────

export function Sparkline({
  data,
  alert = false,
  width = 80,
  height = 24,
  color,
}: {
  data: number[];
  alert?: boolean;
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ');

  const strokeColor = color || (alert ? 'var(--destructive)' : 'var(--primary)');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

// ─── Mini Area Chart ────────────────────────────────────────────────────

export function MiniArea({
  data,
  width = 120,
  height = 40,
  color = 'var(--primary)',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`area-${color.replace(/[^a-z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#area-${color.replace(/[^a-z0-9]/g, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
    </svg>
  );
}

// ─── Mini Bar Chart ─────────────────────────────────────────────────────

export function MiniBar({
  data,
  height = 48,
  barColor = 'bg-primary/60',
  barColor2,
}: {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  barColor?: string;
  barColor2?: string;
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.value, d.value2 || 0]));

  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5 items-end w-full" style={{ height: height - 14 }}>
            <div
              className={`flex-1 rounded-t-sm ${barColor} transition-all duration-500`}
              style={{ height: `${(d.value / maxVal) * 100}%` }}
            />
            {d.value2 !== undefined && barColor2 && (
              <div
                className={`flex-1 rounded-t-sm ${barColor2} transition-all duration-500`}
                style={{ height: `${(d.value2 / maxVal) * 100}%` }}
              />
            )}
          </div>
          <span className="text-[9px] text-muted-foreground/60">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Donut Chart ───────────────────────────────────────────────────

export function MiniDonut({
  segments,
  size = 80,
  strokeWidth = 10,
  centerLabel,
}: {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const dashLength = percent * circumference;
          const dashOffset = -(accumulated / total) * circumference;
          accumulated += seg.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Horizontal Stacked Bar ─────────────────────────────────────────────

export function StackedBar({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string; label?: string }[];
  height?: number;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) return null;

  return (
    <div className="flex rounded-full overflow-hidden" style={{ height }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className="transition-all duration-500"
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Urgency / Status Dot ───────────────────────────────────────────────

export function UrgencyDot({ level }: { level: 'critico' | 'alto' | 'medio' | 'baixo' | 'ok' }) {
  const styles: Record<string, string> = {
    critico: 'bg-destructive shadow-[0_0_8px_var(--glow-destructive)] animate-pulse',
    alto: 'bg-warning shadow-[0_0_6px_var(--glow-warning)]',
    medio: 'bg-primary/50',
    baixo: 'bg-muted-foreground/30',
    ok: 'bg-success/60',
  };
  return <div className={`size-2 rounded-full shrink-0 ${styles[level] || styles.baixo}`} />;
}

// ─── Stat (número grande + label + delta) ───────────────────────────────

export function Stat({
  label,
  value,
  delta,
  deltaType = 'neutral',
  small = false,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral' | 'alert';
  small?: boolean;
}) {
  const deltaColors = {
    positive: 'text-success/70',
    negative: 'text-destructive/70',
    neutral: 'text-muted-foreground/50',
    alert: 'text-warning/70',
  };

  return (
    <div>
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</p>
      <p className={`font-display font-bold mt-0.5 ${small ? 'text-lg' : 'text-xl'}`}>{value}</p>
      {delta && (
        <p className={`text-[11px] mt-0.5 ${deltaColors[deltaType]}`}>{delta}</p>
      )}
    </div>
  );
}

// ─── Progress Ring (compacto) ───────────────────────────────────────────

export function ProgressRing({
  percent,
  size = 40,
  strokeWidth,
  color = 'var(--primary)',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const sw = strokeWidth || size * 0.12;
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={sw} className="text-border/15" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold">{percent}%</span>
      </div>
    </div>
  );
}

// ─── List Item (genérico para listas de items) ──────────────────────────

export function ListItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-xl
                   hover:bg-white/4 transition-all duration-150 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section Title (título de seção na galeria) ─────────────────────────

/**
 * GallerySection — grid que suporta tamanhos variados.
 * Filhos podem usar classes: col-span-2, row-span-2, col-span-full, etc.
 * O grid usa auto-rows de ~min-content para permitir alturas variadas.
 */
export function GallerySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-card-title tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground/50 mt-0.5">{description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
        {children}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVAS AVANÇADAS — O que nunca vi em dashboard nenhum
// ═══════════════════════════════════════════════════════════════════════════

// ─── Animated Number (conta de 0 até o valor ao montar) ─────────────────

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let start: number | null = null;
    const from = 0;
    const to = value;

    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{display.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

// ─── Calendar Heatmap (7x5 grid, estilo GitHub contributions) ───────────

export function CalendarHeatmap({
  data,
  colorScale = 'primary',
}: {
  data: number[];
  colorScale?: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const weeks = Math.ceil(data.length / 7);
  const max = Math.max(...data, 1);
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const colorMap: Record<string, string[]> = {
    primary: [
      'bg-border/10',
      'bg-primary/15',
      'bg-primary/30',
      'bg-primary/50',
      'bg-primary/80',
    ],
    success: [
      'bg-border/10',
      'bg-success/15',
      'bg-success/30',
      'bg-success/50',
      'bg-success/80',
    ],
    warning: [
      'bg-border/10',
      'bg-warning/15',
      'bg-warning/30',
      'bg-warning/50',
      'bg-warning/80',
    ],
    destructive: [
      'bg-border/10',
      'bg-destructive/15',
      'bg-destructive/30',
      'bg-destructive/50',
      'bg-destructive/80',
    ],
  };

  const colors = colorMap[colorScale] || colorMap.primary;

  function getColor(v: number) {
    if (v === 0) return colors[0];
    const bucket = Math.ceil((v / max) * 4);
    return colors[Math.min(bucket, 4)];
  }

  return (
    <div className="flex gap-1">
      <div className="flex flex-col gap-1 mr-0.5">
        {days.map((d, i) => (
          <div key={i} className="h-5 flex items-center text-[8px] text-muted-foreground/55">
            {i % 2 === 0 ? d : ''}
          </div>
        ))}
      </div>
      {Array.from({ length: weeks }).map((_, week) => (
        <div key={week} className="flex flex-col gap-1 flex-1">
          {Array.from({ length: 7 }).map((_, day) => {
            const idx = week * 7 + day;
            const val = data[idx] ?? 0;
            return (
              <div
                key={day}
                className={`h-5 rounded-[3px] transition-colors duration-200 ${getColor(val)}`}
                title={`${val} item${val !== 1 ? 's' : ''}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Gauge Meter (semicircular, estilo velocímetro premium) ─────────────

export function GaugeMeter({
  value,
  max = 100,
  label,
  status = 'neutral',
  size = 100,
}: {
  value: number;
  max?: number;
  label?: string;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  size?: number;
}) {
  const percent = Math.min(value / max, 1);
  const sw = size * 0.1;
  const radius = (size - sw) / 2;
  // Semicircle: half circumference
  const halfCirc = Math.PI * radius;
  const offset = halfCirc - percent * halfCirc;

  const statusColors: Record<string, string> = {
    good: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--destructive)',
    neutral: 'var(--primary)',
  };
  const color = statusColors[status];

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + sw} className="overflow-visible">
        <defs>
          <linearGradient id={`gauge-grad-${status}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${sw / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - sw / 2},${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          className="text-border/10"
        />
        {/* Value */}
        <path
          d={`M ${sw / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - sw / 2},${size / 2}`}
          fill="none"
          stroke={`url(#gauge-grad-${status})`}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="flex flex-col items-center -mt-5">
        <span className="font-display text-xl font-bold">{value}</span>
        {label && <span className="text-[9px] text-muted-foreground/60">{label}</span>}
      </div>
    </div>
  );
}

// ─── Insight Banner (inteligência contextual — "X precisa de atenção") ──

export function InsightBanner({
  type = 'info',
  children,
}: {
  type?: 'alert' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    alert: 'bg-destructive/[0.06] border-destructive/15 text-destructive/80',
    success: 'bg-success/[0.06] border-success/15 text-success/80',
    info: 'bg-primary/[0.06] border-primary/15 text-primary/80',
    warning: 'bg-warning/[0.06] border-warning/15 text-warning/80',
  };

  return (
    <div className={`rounded-lg border px-3 py-2 text-[11px] font-medium ${styles[type]}`}>
      {children}
    </div>
  );
}

// ─── Tab Toggle (alternância simples entre visualizações) ───────────────

export function TabToggle({
  tabs,
  active,
  onChangeAction,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChangeAction: (id: string) => void;
}) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-lg bg-border/10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChangeAction(tab.id)}
          className={`
            px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 cursor-pointer
            ${active === tab.id
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Treemap (visualização de proporção como retângulos aninhados) ──────

export function Treemap({
  segments,
  height = 80,
}: {
  segments: { value: number; label: string; color: string }[];
  height?: number;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) return null;

  return (
    <div className="flex gap-0.5 rounded-lg overflow-hidden" style={{ height }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className="relative group cursor-pointer transition-all duration-200 hover:opacity-90"
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
            minWidth: 2,
          }}
        >
          {/* Label — only visible if segment wide enough */}
          {(seg.value / total) > 0.12 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
              <span className="text-[9px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {seg.value}
              </span>
              <span className="text-[7px] text-white/60 truncate max-w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {seg.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Comparison Card (side-by-side com destaque de diferença) ───────────

export function ComparisonStat({
  label,
  current,
  previous,
  format = 'number',
}: {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'currency' | 'percent';
}) {
  const diff = current - previous;
  const pctChange = previous !== 0 ? ((diff / previous) * 100) : 0;
  const isPositive = diff >= 0;

  const fmt = (v: number) => {
    if (format === 'currency') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (format === 'percent') return `${v.toFixed(1)}%`;
    return v.toLocaleString('pt-BR');
  };

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-lg font-bold">{fmt(current)}</span>
        <span className={`text-[10px] font-medium ${isPositive ? 'text-success/70' : 'text-destructive/70'}`}>
          {isPositive ? '+' : ''}{pctChange.toFixed(1)}%
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground/55">
        anterior: {fmt(previous)}
      </p>
    </div>
  );
}

// ─── Helper: formatar moeda ─────────────────────────────────────────────

export const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtNum = (v: number) => v.toLocaleString('pt-BR');

export const fmtData = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
