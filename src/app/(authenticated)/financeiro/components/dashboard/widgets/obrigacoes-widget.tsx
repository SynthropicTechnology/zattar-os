'use client';

import { AlertTriangle, Clock, Banknote, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ResumoObrigacoesFinanceiro } from '@/app/(authenticated)/financeiro/actions/obrigacoes';

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

interface ObrigacoesWidgetProps {
  resumo: ResumoObrigacoesFinanceiro;
  isLoading: boolean;
}

// ============================================================================
// Mini stat item
// ============================================================================

function ObrigacaoItem({
  label,
  valor,
  quantidade,
  icon: Icon,
  colorClass,
}: {
  label: string;
  valor: number;
  quantidade: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={cn('rounded-md p-2 shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold font-heading tabular-nums">{formatarMoeda(valor)}</p>
        <p className="text-xs text-muted-foreground">
          {quantidade} parcela{quantidade !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ObrigacoesWidget({ resumo, isLoading }: ObrigacoesWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg border p-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = resumo.totalVencidas > 0 || resumo.totalPendentes > 0 || resumo.totalRepassesPendentes > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4 text-muted-foreground" />
          Obrigações e Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!hasData ? (
          <div className="flex items-center justify-center h-full min-h-32">
            <div className="text-center space-y-2">
              <div className="rounded-full bg-muted p-3 mx-auto w-fit">
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Sem obrigações pendentes</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ObrigacaoItem
              label="Vencidas"
              valor={resumo.valorTotalVencido}
              quantidade={resumo.totalVencidas}
              icon={AlertTriangle}
              colorClass="bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
            />
            <ObrigacaoItem
              label="Pendentes"
              valor={resumo.valorTotalPendente}
              quantidade={resumo.totalPendentes}
              icon={Clock}
              colorClass="bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400"
            />
            <ObrigacaoItem
              label="Repasses Pendentes"
              valor={resumo.valorRepassesPendentes}
              quantidade={resumo.totalRepassesPendentes}
              icon={Banknote}
              colorClass="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
