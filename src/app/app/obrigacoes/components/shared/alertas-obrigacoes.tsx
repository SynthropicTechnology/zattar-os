'use client';

/**
 * Componente de Alertas para Obrigações
 * Exibe alertas de obrigações vencidas, vencendo hoje e inconsistentes
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertasObrigacoesType } from '../../domain';

// ============================================================================
// Types
// ============================================================================

interface AlertasObrigacoesProps {
  alertas?: AlertasObrigacoesType | null;
  isLoading?: boolean;
  onFiltrarVencidas?: () => void;
  onFiltrarHoje?: () => void;
  onFiltrarInconsistentes?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

// ============================================================================
// Sub-components
// ============================================================================

function AlertaSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

interface AlertaItemProps {
  variant: 'destructive' | 'warning' | 'default';
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

function AlertaItem({
  variant,
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: AlertaItemProps) {
  const variantStyles = {
    destructive: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    warning: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
    default: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
  };

  const iconStyles = {
    destructive: 'text-red-600',
    warning: 'text-orange-600',
    default: 'text-blue-600',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        variantStyles[variant]
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex-shrink-0', iconStyles[variant])}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {onAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAction}
            className="flex-shrink-0"
          >
            {actionLabel}
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AlertasObrigacoes({
  alertas,
  isLoading = false,
  onFiltrarVencidas,
  onFiltrarHoje,
  onFiltrarInconsistentes,
}: AlertasObrigacoesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <AlertaSkeleton />
      </div>
    );
  }

  if (!alertas) {
    return null;
  }

  const { vencidas, vencendoHoje, inconsistentes } = alertas;
  const hasAlerts =
    vencidas.quantidade > 0 ||
    vencendoHoje.quantidade > 0 ||
    inconsistentes.quantidade > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Alerta de Vencidas */}
      {vencidas.quantidade > 0 && (
        <AlertaItem
          variant="destructive"
          icon={<AlertCircle className="h-5 w-5" />}
          title={`${vencidas.quantidade} obrigação${vencidas.quantidade > 1 ? 'ões' : ''} vencida${vencidas.quantidade > 1 ? 's' : ''}`}
          description={`Total vencido: ${formatarValor(vencidas.valor)}`}
          actionLabel="Ver"
          onAction={onFiltrarVencidas}
        />
      )}

      {/* Alerta de Vencendo Hoje */}
      {vencendoHoje.quantidade > 0 && (
        <AlertaItem
          variant="warning"
          icon={<Clock className="h-5 w-5" />}
          title={`${vencendoHoje.quantidade} obrigação${vencendoHoje.quantidade > 1 ? 'ões' : ''} vence${vencendoHoje.quantidade > 1 ? 'm' : ''} hoje`}
          description={`Total: ${formatarValor(vencendoHoje.valor)}`}
          actionLabel="Ver"
          onAction={onFiltrarHoje}
        />
      )}

      {/* Alerta de Inconsistentes */}
      {inconsistentes.quantidade > 0 && (
        <AlertaItem
          variant="default"
          icon={<RefreshCw className="h-5 w-5" />}
          title={`${inconsistentes.quantidade} obrigação${inconsistentes.quantidade > 1 ? 'ões' : ''} com inconsistência de sincronização`}
          description="Parcelas sem lançamento financeiro correspondente ou com valores divergentes"
          actionLabel="Ver"
          onAction={onFiltrarInconsistentes}
        />
      )}
    </div>
  );
}
