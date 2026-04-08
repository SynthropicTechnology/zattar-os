'use client';

import * as React from 'react';
import { History, ArrowRight, Circle, CheckCircle2, XCircle, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { ContratoStatusHistorico, StatusContrato } from '@/app/(authenticated)/contratos';
import { STATUS_CONTRATO_LABELS } from '@/app/(authenticated)/contratos';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface ContratoTimelineProps {
  historico: ContratoStatusHistorico[];
}

function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getStatusIcon(status: StatusContrato) {
  switch (status) {
    case 'em_contratacao':
      return <Clock className="size-4" />;
    case 'contratado':
      return <CheckCircle2 className="size-4" />;
    case 'distribuido':
      return <CheckCircle2 className="size-4" />;
    case 'desistencia':
      return <XCircle className="size-4" />;
    default:
      return <Circle className="size-4" />;
  }
}

export function ContratoTimeline({ historico }: ContratoTimelineProps) {
  const isEmpty = historico.length === 0;

  // Sort by date descending (most recent first)
  const sortedHistorico = [...historico].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="size-4" />
          Histórico de Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="size-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum histórico disponível</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {sortedHistorico.map((item, index) => {
                const isFirst = index === 0;
                const toStatusLabel = STATUS_CONTRATO_LABELS[item.toStatus] || item.toStatus;
                const fromStatusLabel = item.fromStatus
                  ? STATUS_CONTRATO_LABELS[item.fromStatus] || item.fromStatus
                  : null;
                const variant = getSemanticBadgeVariant('status_contrato', item.toStatus);

                return (
                  <div key={item.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                        isFirst ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {getStatusIcon(item.toStatus)}
                    </div>

                    <div className="space-y-1">
                      {/* Status change */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {fromStatusLabel && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {fromStatusLabel}
                            </Badge>
                            <ArrowRight className="size-3 text-muted-foreground" />
                          </>
                        )}
                        <Badge variant={variant}>
                          {toStatusLabel}
                        </Badge>
                      </div>

                      {/* Date and reason */}
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(item.changedAt)}
                      </div>

                      {item.reason && (
                        <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                          {item.reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
