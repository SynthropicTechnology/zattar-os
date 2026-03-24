/**
 * @fileoverview Componentes de gráficos miniatura usando Recharts
 *
 * @description Biblioteca de mini-gráficos para uso em dashboards e cards.
 *              Todos os componentes utilizam o wrapper ClientOnly para garantir
 *              renderização apenas no client-side, evitando erros de SSR.
 *
 * @note Para otimização de bundle em páginas que usam poucos gráficos,
 *       considere lazy-load via next/dynamic nos componentes que usam estes charts:
 *
 * @example
 * ```typescript
 * const MiniLineChart = dynamic(
 *   () => import('@/components/ui/charts/mini-chart').then(m => ({ default: m.MiniLineChart })),
 *   { ssr: false, loading: () => <Skeleton className="h-20 w-full" /> }
 * );
 * ```
 */
'use client';

import { useId } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/shared/client-only';
import { SafeResponsiveContainer } from '@/hooks/use-chart-ready';

// Cores padrão para gráficos
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: 'hsl(var(--muted-foreground))',
};

export const CHART_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ============================================================================
// Mini Line Chart
// ============================================================================

interface MiniLineChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  className?: string;
}

export function MiniLineChart({
  data,
  dataKey = 'value',
  color = CHART_COLORS.primary,
  height = 80,
  showGrid = false,
  showTooltip = true,
  showXAxis = false,
  className,
}: MiniLineChartProps) {
  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            {showXAxis && (
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
            )}
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Mini Area Chart
// ============================================================================

interface MiniAreaChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  gradient?: boolean;
  className?: string;
}

export function MiniAreaChart({
  data,
  dataKey = 'value',
  color = CHART_COLORS.primary,
  height = 80,
  showGrid = false,
  showTooltip = true,
  showXAxis = false,
  gradient = true,
  className,
}: MiniAreaChartProps) {
  const uniqueId = useId();
  const gradientId = `gradient-${dataKey}-${uniqueId}`;

  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            {showXAxis && (
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
            )}
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
            )}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={gradient ? `url(#${gradientId})` : color}
              fillOpacity={gradient ? 1 : 0.2}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Mini Bar Chart
// ============================================================================

interface MiniBarChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  horizontal?: boolean;
  className?: string;
}

export function MiniBarChart({
  data,
  dataKey = 'value',
  color = CHART_COLORS.primary,
  height = 120,
  showGrid = false,
  showTooltip = true,
  showXAxis = true,
  showYAxis = false,
  horizontal = false,
  className,
}: MiniBarChartProps) {
  const layout = horizontal ? 'vertical' : 'horizontal';

  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 5, right: 5, bottom: 5, left: horizontal ? 60 : 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            {horizontal ? (
              <>
                <XAxis type="number" hide={!showYAxis} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={55}
                />
              </>
            ) : (
              <>
                {showXAxis && (
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                )}
                {showYAxis && (
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                )}
              </>
            )}
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
              />
            )}
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Mini Pie/Donut Chart
// ============================================================================

interface MiniPieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  showTooltip?: boolean;
  showLabels?: boolean;
  colors?: string[];
  className?: string;
}

export function MiniPieChart({
  data,
  height = 120,
  innerRadius = 0,
  showTooltip = true,
  showLabels = false,
  colors = CHART_PALETTE,
  className,
}: MiniPieChartProps) {
  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
            )}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              label={
                showLabels
                  ? ({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  : undefined
              }
              labelLine={showLabels}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Donut Chart (alias for Pie with inner radius)
// ============================================================================

interface MiniDonutChartProps extends Omit<MiniPieChartProps, 'innerRadius'> {
  thickness?: number;
  centerContent?: React.ReactNode;
}

export function MiniDonutChart({
  data,
  height = 120,
  thickness = 20,
  showTooltip = true,
  colors = CHART_PALETTE,
  centerContent,
  className,
}: MiniDonutChartProps) {
  return (
    <div className={cn('w-full min-w-0 relative', className)} style={{ height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
            )}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={`${100 - thickness * 2}%`}
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </SafeResponsiveContainer>
      </ClientOnly>
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sparkline (ultra minimal line chart)
// ============================================================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | string;
  className?: string;
}

export function Sparkline({
  data,
  color = CHART_COLORS.primary,
  height = 24,
  width = 80,
  className,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ name: index.toString(), value }));

  return (
    <div className={cn('inline-block min-w-0', className)} style={{ width, height }}>
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Progress Bar Chart (horizontal stacked bar for showing distribution)
// ============================================================================

interface ProgressBarData {
  name: string;
  value: number;
  color: string;
}

interface ProgressBarChartProps {
  data: ProgressBarData[];
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function ProgressBarChart({
  data,
  height = 8,
  showLabels = false,
  className,
}: ProgressBarChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex rounded-full overflow-hidden" style={{ height }}>
        {data.map((item, index) => {
          const width = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className="transition-all duration-300"
              style={{
                width: `${width}%`,
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.value}`}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
