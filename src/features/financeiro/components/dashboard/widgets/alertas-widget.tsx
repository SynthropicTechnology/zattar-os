'use client';

import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Alerta {
  tipo: string;
  mensagem: string;
}

interface AlertasWidgetProps {
  alertas: Alerta[];
  isLoading: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const SEVERITY_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  iconClass: string;
  label: string;
}> = {
  danger: {
    icon: AlertTriangle,
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900',
    iconClass: 'text-red-600 dark:text-red-400',
    label: 'Crítico',
  },
  warning: {
    icon: AlertCircle,
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900',
    iconClass: 'text-orange-600 dark:text-orange-400',
    label: 'Atenção',
  },
  info: {
    icon: Info,
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    iconClass: 'text-blue-600 dark:text-blue-400',
    label: 'Info',
  },
};

// ============================================================================
// Component
// ============================================================================

export function AlertasWidget({ alertas, isLoading }: AlertasWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Alertas</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedAlertas = [...alertas].sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 };
    return (order[a.tipo as keyof typeof order] ?? 3) - (order[b.tipo as keyof typeof order] ?? 3);
  });

  const visibleAlertas = sortedAlertas.slice(0, 5);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Alertas
          </div>
          {alertas.length > 0 && (
            <SemanticBadge category="status" value={alertas.length} variantOverride="secondary" className="text-xs tabular-nums">
              {alertas.length}
            </SemanticBadge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {alertas.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-32">
            <div className="text-center space-y-2">
              <div className="rounded-full bg-green-100 dark:bg-green-950/50 p-3 mx-auto w-fit">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleAlertas.map((alerta, idx) => {
              const config = SEVERITY_CONFIG[alerta.tipo] || SEVERITY_CONFIG.info;
              const Icon = config.icon;

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
                    config.badgeClass
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.iconClass)} />
                  <span className="flex-1 leading-snug">{alerta.mensagem}</span>
                </div>
              );
            })}
            {alertas.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{alertas.length - 5} alerta{alertas.length - 5 !== 1 ? 's' : ''} adiciona{alertas.length - 5 !== 1 ? 'is' : 'l'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
