'use client';

import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientOnly } from '@/components/shared/client-only';
import { SafeResponsiveContainer } from '@/hooks/use-chart-ready';
import { useFluxoCaixa } from '../../hooks';

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetFluxoCaixa() {
  const { data, isLoading, error } = useFluxoCaixa(6);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="min-h-80 lg:min-h-90">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent className="min-h-80 lg:min-h-90 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">Fluxo de Caixa (6 meses)</span>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/financeiro/dre">Ver mais</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-70 overflow-x-auto">
        <div className="w-full h-64 sm:h-72 lg:h-80" style={{ minHeight: 200 }}>
          <ClientOnly>
            <SafeResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
              <BarChart data={data || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10 }}
                  className="text-xs sm:text-sm"
                />
                <YAxis
                  tickFormatter={(value) => formatarValor(value as number)}
                  tick={{ fontSize: 10 }}
                  className="text-xs sm:text-sm"
                  width={70}
                />
                <Tooltip
                  formatter={(value) => typeof value === 'number' ? formatarValor(value) : String(value ?? '')}
                  contentStyle={{ fontSize: '12px' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar dataKey="receitas" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </SafeResponsiveContainer>
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  );
}
