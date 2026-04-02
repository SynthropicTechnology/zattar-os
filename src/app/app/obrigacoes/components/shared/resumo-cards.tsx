'use client';

/**
 * Componente de Cards de Resumo para Obrigações
 * Exibe métricas consolidadas do módulo de obrigações
 *
 * @ai-context Cores alinhadas com design system semântico:
 * - green (success): recebimentos, positivo, efetivado
 * - red (destructive): pagamentos, vencido, negativo
 * - orange (warning): pendente
 * - blue (info): vence hoje
 * - purple (accent): vence em breve
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumoObrigacoes } from '../../domain';

// ============================================================================
// Types
// ============================================================================

interface ResumoCardsProps {
  resumo?: ResumoObrigacoes | null;
  isLoading?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: valor >= 1000000 ? 'compact' : 'standard',
  }).format(valor);
};

// ============================================================================
// Sub-components
// ============================================================================

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconClassName?: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && trendLabel && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={cn(
                'text-xs',
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ResumoCards({ resumo, isLoading = false }: ResumoCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!resumo) {
    return null;
  }

  // Valores padrão para propriedades que podem estar undefined
  const defaultMetric = { quantidade: 0, valor: 0 };
  const pendentes = resumo.pendentes ?? defaultMetric;
  const vencidas = resumo.vencidas ?? defaultMetric;
  const efetivadas = resumo.efetivadas ?? defaultMetric;
  const vencendoHoje = resumo.vencendoHoje ?? defaultMetric;
  const vencendoEm7Dias = resumo.vencendoEm7Dias ?? defaultMetric;
  const porTipo = resumo.porTipo ?? [];

  // Calcular totais para recebimentos e pagamentos
  const totalRecebimentos = porTipo
    .filter((t) => t.tipo === 'acordo_recebimento' || t.tipo === 'conta_receber')
    .reduce((acc, t) => acc + t.valorTotalPendente, 0);

  const totalPagamentos = porTipo
    .filter((t) => t.tipo === 'acordo_pagamento' || t.tipo === 'conta_pagar')
    .reduce((acc, t) => acc + t.valorTotalPendente, 0);

  const saldoPrevisto = totalRecebimentos - totalPagamentos;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Pendente */}
      <MetricCard
        title="Total Pendente"
        value={formatarValor(pendentes.valor)}
        subtitle={`${pendentes.quantidade} obrigações`}
        icon={Clock}
        iconClassName="text-orange-600"
      />

      {/* Total Vencido */}
      <MetricCard
        title="Total Vencido"
        value={formatarValor(vencidas.valor)}
        subtitle={`${vencidas.quantidade} obrigações`}
        icon={AlertTriangle}
        iconClassName="text-red-600"
      />

      {/* A Receber */}
      <MetricCard
        title="A Receber (Pendente)"
        value={formatarValor(totalRecebimentos)}
        subtitle="Acordos + Contas"
        icon={ArrowDown}
        iconClassName="text-green-600"
      />

      {/* A Pagar */}
      <MetricCard
        title="A Pagar (Pendente)"
        value={formatarValor(totalPagamentos)}
        subtitle="Acordos + Contas"
        icon={ArrowUp}
        iconClassName="text-red-600"
      />

      {/* Cards adicionais em linha abaixo */}
      <MetricCard
        title="Efetivado (Mês)"
        value={formatarValor(efetivadas.valor)}
        subtitle={`${efetivadas.quantidade} operações`}
        icon={CheckCircle2}
        iconClassName="text-green-600"
      />

      <MetricCard
        title="Vence Hoje"
        value={formatarValor(vencendoHoje.valor)}
        subtitle={`${vencendoHoje.quantidade} obrigações`}
        icon={Clock}
        iconClassName="text-blue-600"
      />

      <MetricCard
        title="Vence em 7 Dias"
        value={formatarValor(vencendoEm7Dias.valor)}
        subtitle={`${vencendoEm7Dias.quantidade} obrigações`}
        icon={Clock}
        iconClassName="text-purple-600"
      />

      {/* Saldo Previsto */}
      <MetricCard
        title="Saldo Previsto"
        value={formatarValor(saldoPrevisto)}
        subtitle={saldoPrevisto >= 0 ? 'Positivo' : 'Negativo'}
        icon={Wallet}
        iconClassName={saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'}
        trend={saldoPrevisto >= 0 ? 'up' : 'down'}
        trendLabel={saldoPrevisto >= 0 ? 'Superávit' : 'Déficit'}
      />
    </div>
  );
}
