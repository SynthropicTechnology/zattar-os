'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProcessoResumo } from '../../domain';

interface WidgetProcessosResumoProps {
  data: ProcessoResumo;
  loading?: boolean;
  error?: string;
}

export function WidgetProcessosResumo({ data, loading, error }: WidgetProcessosResumoProps) {
  if (loading) {
    return (
      <GlassPanel>
        <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <CardHeader><CardTitle>Processos</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">{error}</p></CardContent>
      </GlassPanel>
    );
  }

  if (data.total === 0) {
    return (
      <GlassPanel>
        <CardHeader>
          <CardTitle>Processos</CardTitle>
          <CardDescription>Distribuição e análise</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum processo atribuído</p>
        </CardContent>
      </GlassPanel>
    );
  }

  const ativosPercent = Math.round((data.ativos / data.total) * 100);

  return (
    <GlassPanel>
      <CardHeader>
        <CardTitle>Processos</CardTitle>
        <CardDescription>Distribuição e análise</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main numbers */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-display text-2xl">{data.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <div className="font-display text-2xl">{data.ativos}</div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div>
            <div className="font-display text-2xl">{data.arquivados}</div>
            <p className="text-xs text-muted-foreground">Arquivados</p>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ativos {ativosPercent}%</span>
            <span>Arquivados {100 - ativosPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-primary transition-all" style={{ width: `${ativosPercent}%` }} />
          </div>
        </div>

        {/* Por Grau */}
        {data.porGrau.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.porGrau.map((item) => (
              <Badge key={item.grau} variant="outline">
                {item.grau}: {item.count}
              </Badge>
            ))}
          </div>
        )}

        {/* Top TRTs */}
        {data.porTRT.length > 0 && (
          <div className="space-y-1.5">
            {data.porTRT.slice(0, 3).map((item) => (
              <div key={item.trt} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">TRT {item.trt}</span>
                <span className="font-medium tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        )}

        <Link href="/app/processos" className="block">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
            Ver todos os processos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </GlassPanel>
  );
}
