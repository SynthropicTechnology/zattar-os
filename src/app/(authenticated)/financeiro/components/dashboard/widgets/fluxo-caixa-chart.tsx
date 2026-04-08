'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientOnly } from '@/components/shared/client-only';
import { SafeResponsiveContainer } from '@/hooks/use-chart-ready';

// ============================================================================
// Helpers
// ============================================================================

const MESES_ABREV: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function formatarPeriodo(periodo: string): string {
  // Formato pode ser "2025-01" ou "Janeiro 2025" etc
  const parts = periodo.split('-');
  if (parts.length === 2 && MESES_ABREV[parts[1]]) {
    return MESES_ABREV[parts[1]];
  }
  return periodo.length > 5 ? periodo.slice(0, 5) : periodo;
}

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(valor) >= 100_000 ? 'compact' : 'standard',
  }).format(valor);

const formatarMoedaCurta = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
  }).format(valor);

// ============================================================================
// Types
// ============================================================================

interface FluxoCaixaData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo?: number;
}

interface FluxoCaixaChartProps {
  data: FluxoCaixaData[];
  isLoading: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function FluxoCaixaChart({ data, isLoading }: FluxoCaixaChartProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="min-h-72">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calcular saldo acumulado para a linha
  let saldoAcumulado = 0;
  const chartData = data.map((item) => {
    saldoAcumulado += (item.receitas - item.despesas);
    return {
      ...item,
      periodo: formatarPeriodo(item.mes),
      saldoAcumulado,
    };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="w-full h-72 lg:h-80">
          <ClientOnly>
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="periodo"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatarMoedaCurta}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  width={65}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatarMoeda(Number(value)),
                    name === 'receitas' ? 'Entradas' :
                      name === 'despesas' ? 'Saídas' : 'Saldo Acumulado',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === 'receitas' ? 'Entradas' :
                      value === 'despesas' ? 'Saídas' : 'Saldo Acumulado'
                  }
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar
                  dataKey="receitas"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="despesas"
                  fill="var(--destructive)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="saldoAcumulado"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--primary)' }}
                />
              </ComposedChart>
            </SafeResponsiveContainer>
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  );
}
