'use client';

import Link from 'next/link';
import { ArrowUpFromLine, ArrowDownToLine, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProgressBarChart } from '@/components/ui/charts/mini-chart';
import { cn } from '@/lib/utils';

// ============================================================================
// Helpers
// ============================================================================

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(valor) >= 1_000_000 ? 'compact' : 'standard',
  }).format(valor);

// ============================================================================
// Types
// ============================================================================

interface ContasResumoWidgetProps {
  contasPagar: {
    quantidade: number;
    valor: number;
  };
  contasReceber: {
    quantidade: number;
    valor: number;
  };
  isLoading: boolean;
}

// ============================================================================
// Sub-component
// ============================================================================

function ContaSection({
  title,
  icon: Icon,
  valor,
  quantidade,
  href,
  colorClass,
  iconColorClass,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  valor: number;
  quantidade: number;
  href: string;
  colorClass: string;
  iconColorClass: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-md p-1.5', colorClass)}>
            <Icon className={cn('h-3.5 w-3.5', iconColorClass)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
          <Link href={href}>
            Ver <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div>
        <p className="text-lg font-bold font-heading tabular-nums">{formatarMoeda(valor)}</p>
        <p className="text-xs text-muted-foreground">
          {quantidade} conta{quantidade !== 1 ? 's' : ''} pendente{quantidade !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ContasResumoWidget({ contasPagar, contasReceber, isLoading }: ContasResumoWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = contasPagar.valor + contasReceber.valor;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Contas a Pagar / Receber
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <ContaSection
          title="A Pagar"
          icon={ArrowUpFromLine}
          valor={contasPagar.valor}
          quantidade={contasPagar.quantidade}
          href="/app/financeiro/contas-pagar"
          colorClass="bg-warning/10"
          iconColorClass="text-warning"
        />

        {/* Barra de proporção */}
        {total > 0 && (
          <ProgressBarChart
            data={[
              { name: 'A Pagar', value: contasPagar.valor, color: 'var(--warning)' },
              { name: 'A Receber', value: contasReceber.valor, color: 'var(--info)' },
            ]}
            height={6}
            showLabels
          />
        )}

        <ContaSection
          title="A Receber"
          icon={ArrowDownToLine}
          valor={contasReceber.valor}
          quantidade={contasReceber.quantidade}
          href="/app/financeiro/contas-receber"
          colorClass="bg-info/10"
          iconColorClass="text-info"
        />
      </CardContent>
    </Card>
  );
}
