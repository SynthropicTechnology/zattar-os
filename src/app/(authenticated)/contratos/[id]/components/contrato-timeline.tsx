'use client';

import * as React from 'react';
import { History, CheckCircle2, XCircle, Clock, Plus, ArrowRightLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import type { ContratoStatusHistorico, StatusContrato } from '@/app/(authenticated)/contratos';
import { STATUS_CONTRATO_LABELS } from '@/app/(authenticated)/contratos';

interface ContratoTimelineProps {
  historico: ContratoStatusHistorico[];
}

function formatTime(dateStr: string): string {
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

function getEventIcon(toStatus: StatusContrato, isCreation: boolean) {
  if (isCreation) return Plus;

  switch (toStatus) {
    case 'contratado':
    case 'distribuido':
      return CheckCircle2;
    case 'desistencia':
      return XCircle;
    case 'em_contratacao':
      return Clock;
    default:
      return ArrowRightLeft;
  }
}

function getIconColorClass(toStatus: StatusContrato, isCreation: boolean): string {
  if (isCreation) return 'bg-primary/10 text-primary';

  switch (toStatus) {
    case 'contratado':
    case 'distribuido':
      return 'bg-success/10 text-success';
    case 'desistencia':
      return 'bg-destructive/10 text-destructive';
    case 'em_contratacao':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function groupByMonth(
  items: ContratoStatusHistorico[],
): Record<string, ContratoStatusHistorico[]> {
  return items.reduce(
    (acc, entry) => {
      const monthKey = new Date(entry.changedAt).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(entry);
      return acc;
    },
    {} as Record<string, ContratoStatusHistorico[]>,
  );
}

export function ContratoTimeline({ historico }: ContratoTimelineProps) {
  const isEmpty = historico.length === 0;

  // Sort by date descending (most recent first)
  const sortedHistorico = [...historico].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );

  const grouped = groupByMonth(sortedHistorico);

  // Flatten to get global index for isLast check
  const flatItems = sortedHistorico;

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
          <div>
            {Object.entries(grouped).map(([monthLabel, items]) => (
              <div key={monthLabel}>
                {/* Month group header */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 pb-2 pl-10">
                  {monthLabel}
                </p>

                {items.map((item) => {
                  const globalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                  const isLast = globalIndex === flatItems.length - 1;
                  const isCreation = item.fromStatus === null;
                  const EventIcon = getEventIcon(item.toStatus, isCreation);
                  const iconColorClass = getIconColorClass(item.toStatus, isCreation);

                  return (
                    <div key={item.id} className="flex gap-3 pb-6 relative">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border/20" />
                      )}

                      {/* Icon dot */}
                      <IconContainer size="sm" className={iconColorClass}>
                        <EventIcon className="size-3.5" />
                      </IconContainer>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        {isCreation ? (
                          <p className="text-[13px] text-foreground">
                            Contrato criado com status{' '}
                            <SemanticBadge category="status_contrato" value={item.toStatus}>
                              {STATUS_CONTRATO_LABELS[item.toStatus]}
                            </SemanticBadge>
                          </p>
                        ) : (
                          <p className="text-[13px] text-foreground">
                            Status alterado para{' '}
                            <SemanticBadge category="status_contrato" value={item.toStatus}>
                              {STATUS_CONTRATO_LABELS[item.toStatus]}
                            </SemanticBadge>
                          </p>
                        )}

                        <Text variant="caption" className="mt-0.5">
                          {formatTime(item.changedAt)}
                        </Text>

                        {item.reason && (
                          <div className="text-[12px] text-muted-foreground mt-1.5 p-2 bg-muted/50 rounded-md">
                            {item.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
