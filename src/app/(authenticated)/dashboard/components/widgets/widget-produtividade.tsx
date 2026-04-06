'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { ProdutividadeResumo } from '../../domain';

interface WidgetProdutividadeProps {
  data: ProdutividadeResumo;
  loading?: boolean;
  error?: string;
}

export function WidgetProdutividade({ data, loading, error }: WidgetProdutividadeProps) {
  if (loading) {
    return (
      <GlassPanel>
        <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <CardHeader><CardTitle>Produtividade</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">{error}</p></CardContent>
      </GlassPanel>
    );
  }

  const trendDirection: 'up' | 'down' | 'neutral' =
    data.comparativoSemanaAnterior > 0 ? 'up'
    : data.comparativoSemanaAnterior < 0 ? 'down'
    : 'neutral';

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  const porDia = data.porDia || [];
  const maxBaixas = Math.max(...porDia.map((d) => d.baixas), 1);

  return (
    <GlassPanel>
      <CardHeader>
        <CardTitle>Produtividade</CardTitle>
        <CardDescription>Baixas e atividades recentes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main numbers */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-display text-2xl">{data.baixasHoje}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div>
            <div className="font-display text-2xl">{data.baixasSemana}</div>
            <p className="text-xs text-muted-foreground">Semana</p>
          </div>
          <div>
            <div className="font-display text-2xl">{data.baixasMes}</div>
            <p className="text-xs text-muted-foreground">Mês</p>
          </div>
        </div>

        {/* Trend comparison */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">vs. semana anterior</span>
          <Badge
            variant={trendDirection === 'up' ? 'success' : trendDirection === 'down' ? 'destructive' : 'outline'}
            className="text-xs gap-1"
          >
            <TrendIcon className="h-3 w-3" />
            {data.comparativoSemanaAnterior > 0 ? '+' : ''}{data.comparativoSemanaAnterior}%
          </Badge>
        </div>

        {/* Average */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Média diária (mês)</span>
          <span className="font-medium tabular-nums">{data.mediaDiaria.toFixed(1)}</span>
        </div>

        {/* Last 7 days bar chart */}
        {porDia.length > 0 && (
          <div className="space-y-1.5">
            {porDia.map((dia) => {
              const percent = (dia.baixas / maxBaixas) * 100;
              const date = new Date(dia.data);
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
              const dayNumber = date.getDate();

              return (
                <div key={dia.data} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-muted-foreground shrink-0">
                    {dayName}, {dayNumber}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-6 text-right font-medium tabular-nums">{dia.baixas}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </GlassPanel>
  );
}
