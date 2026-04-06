'use client';

import { Pie, PieChart, Tooltip, Cell } from 'recharts';
import Link from 'next/link';
import { PieChart as PieIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientOnly } from '@/components/shared/client-only';
import { SafeResponsiveContainer } from '@/hooks/use-chart-ready';
import { useDespesasPorCategoria } from '../../hooks';

// Cores do gráfico devem vir do tema (tokens), sem hardcode em componentes de feature
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const DOT_BG_CLASSES = [
  'bg-[var(--chart-1)]',
  'bg-[var(--chart-2)]',
  'bg-[var(--chart-3)]',
  'bg-[var(--chart-4)]',
  'bg-[var(--chart-5)]',
];

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// Helper para garantir que categoria é sempre string
const normalizarCategoria = (categoria: unknown): string => {
  if (typeof categoria === 'string') return categoria;
  if (categoria && typeof categoria === 'object') {
    // Se for objeto, tenta extrair propriedades comuns
    const obj = categoria as Record<string, unknown>;
    return String(obj.nome || obj.descricao || obj.id || 'Sem categoria');
  }
  return String(categoria || 'Sem categoria');
};

export function WidgetDespesasCategoria() {
  const { despesasPorCategoria, isLoading, error } = useDespesasPorCategoria();

  if (isLoading) {
    return (
      <Card className="h-full glass-widget bg-transparent transition-all duration-200">
        <CardHeader>
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="min-h-80 lg:min-h-90">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full glass-widget bg-transparent transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-sm">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="min-h-80 lg:min-h-90 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col glass-widget bg-transparent transition-all duration-200">
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-widget-title">
          <PieIcon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">Despesas por Categoria</span>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/financeiro/dre">DRE</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-70">
        <div className="flex items-center justify-center min-h-55">
          <div className="w-full h-64 sm:h-72 lg:h-80" style={{ minHeight: 220 }}>
            <ClientOnly>
              <SafeResponsiveContainer width="100%" height="100%" minWidth={150} minHeight={220}>
                <PieChart>
                  <Pie
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data={(despesasPorCategoria || []) as any[]}
                    dataKey="valor"
                    nameKey="categoria"
                    outerRadius={80}
                    innerRadius={0}
                  >
                    {(despesasPorCategoria || []).map((entry, index) => (
                      <Cell key={normalizarCategoria(entry.categoria) + index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => typeof value === 'number' ? formatarValor(value) : String(value ?? '')}
                    contentStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </SafeResponsiveContainer>
            </ClientOnly>
          </div>
        </div>
        <div className="space-y-2 text-xs sm:text-sm max-h-64 sm:max-h-72 lg:max-h-80 overflow-y-auto">
          {(despesasPorCategoria || []).map((item, idx) => {
            const categoriaNome = normalizarCategoria(item.categoria);
            return (
              <div key={categoriaNome + idx} className="flex items-center justify-between rounded-md bg-muted/60 p-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`h-3 w-3 rounded-full shrink-0 ${DOT_BG_CLASSES[idx % DOT_BG_CLASSES.length]}`}
                  />
                  <span className="truncate">{categoriaNome}</span>
                </div>
                <span className="font-medium whitespace-nowrap">{formatarValor(item.valor)}</span>
              </div>
            );
          })}
          {!despesasPorCategoria?.length && (
            <p className="text-xs text-muted-foreground">Sem dados disponíveis.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
