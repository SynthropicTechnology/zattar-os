'use client';

import { useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

function formatarMes(mesKey: string): string {
  const [, mes] = mesKey.split('-');
  return MESES_ABREV[mes] || mesKey;
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

interface EvolucaoMensalChartProps {
  data: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export function EvolucaoMensalChart({ data }: EvolucaoMensalChartProps) {
  const uniqueId = useId();
  const gradientReceitas = `grad-receitas-${uniqueId}`;
  const gradientDespesas = `grad-despesas-${uniqueId}`;
  const gradientSaldo = `grad-saldo-${uniqueId}`;

  const chartData = data.map((item) => ({
    ...item,
    mesLabel: formatarMes(item.mes),
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Evolução Mensal (12 meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="w-full h-72 lg:h-80">
          <ClientOnly>
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientReceitas} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={gradientDespesas} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={gradientSaldo} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="mesLabel"
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
                    name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Saldo',
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
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
                    value === 'receitas' ? 'Receitas' : value === 'despesas' ? 'Despesas' : 'Saldo'
                  }
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="var(--success)"
                  strokeWidth={2}
                  fill={`url(#${gradientReceitas})`}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--success)' }}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  fill={`url(#${gradientDespesas})`}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--destructive)' }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill={`url(#${gradientSaldo})`}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--primary)' }}
                />
              </AreaChart>
            </SafeResponsiveContainer>
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  );
}
