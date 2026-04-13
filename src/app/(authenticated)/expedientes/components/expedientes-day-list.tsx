'use client';

/**
 * ExpedientesDayList - Lista de expedientes do dia selecionado
 *
 * Componente para exibicao no painel direito do layout master-detail.
 * Mostra todos os expedientes de um dia especifico em cards compactos,
 * agrupados por nivel de urgencia.
 */

import * as React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';

import { type Expediente, type UrgencyLevel, getExpedienteUrgencyLevel, getExpedientePartyNames } from '../domain';
import {
  URGENCY_SECTIONS,
  URGENCY_BORDER,
} from './urgency-helpers';

// =============================================================================
// TIPOS
// =============================================================================

interface ExpedientesDayListProps {
  /** Data selecionada para exibir expedientes */
  selectedDate: Date;
  /** Todos os expedientes (serao filtrados pelo dia) */
  expedientes: Expediente[];
  /** Callback para adicionar novo expediente */
  onAddExpediente?: () => void;
  /** Callback para visualizar detalhes de um expediente */
  onViewDetail?: (expediente: Expediente) => void;
  /** Classes CSS adicionais */
  className?: string;
}

// =============================================================================
// URGENCY SECTION DIVIDER
// =============================================================================

function UrgencySection({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1">
      <div className={cn('size-1.5 rounded-full', color)} />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{label}</span>
      <span className="text-[9px] tabular-nums text-muted-foreground/40">{count}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesDayList({
  selectedDate,
  expedientes,
  onAddExpediente,
  onViewDetail,
  className,
}: ExpedientesDayListProps) {
  // Filtrar expedientes do dia selecionado
  const expedientesDoDia = React.useMemo(() => {
    return expedientes
      .filter((exp) => {
        // Expedientes sem data nao aparecem
        if (!exp.dataPrazoLegalParte) return false;

        return isSameDay(parseISO(exp.dataPrazoLegalParte), selectedDate);
      })
      .sort((a, b) => {
        // Vencidos (prazoVencido === true AND baixadoEm is null) primeiro
        const aVencidoPendente = a.prazoVencido && !a.baixadoEm;
        const bVencidoPendente = b.prazoVencido && !b.baixadoEm;

        if (aVencidoPendente && !bVencidoPendente) return -1;
        if (!aVencidoPendente && bVencidoPendente) return 1;

        // Depois ordenar por data
        const dateA = a.dataPrazoLegalParte ? parseISO(a.dataPrazoLegalParte).getTime() : 0;
        const dateB = b.dataPrazoLegalParte ? parseISO(b.dataPrazoLegalParte).getTime() : 0;
        return dateA - dateB;
      });
  }, [expedientes, selectedDate]);

  // Group expedientes by urgency level
  const groups = React.useMemo(() => {
    const g: Record<UrgencyLevel, Expediente[]> = { critico: [], alto: [], medio: [], baixo: [], ok: [] };
    for (const exp of expedientesDoDia) {
      g[getExpedienteUrgencyLevel(exp)].push(exp);
    }
    return g;
  }, [expedientesDoDia]);

  // Formatar header - weekday e data formatada
  const weekday = React.useMemo(() => {
    const formatted = format(selectedDate, 'EEEE', { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate]);

  const dayFormatted = React.useMemo(() => {
    return format(selectedDate, "d 'de' MMMM", { locale: ptBR });
  }, [selectedDate]);

  // Determinar status do expediente
  const getStatus = React.useCallback((expediente: Expediente) => {
    if (expediente.baixadoEm) {
      return { label: 'Baixado', variant: 'success' as const };
    }
    if (expediente.prazoVencido) {
      return { label: 'Vencido', variant: 'destructive' as const };
    }
    return { label: 'Pendente', variant: 'default' as const };
  }, []);

  const count = expedientesDoDia.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="overline" className="text-primary/70">{weekday}</Text>
            <Heading level="card" className="mt-0.5">{dayFormatted}</Heading>
            <Text variant="caption">{count} expediente{count !== 1 ? 's' : ''}</Text>
          </div>
          {onAddExpediente && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onAddExpediente}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo
            </Button>
          )}
        </div>
      </div>

      {/* Lista de expedientes agrupados por urgencia */}
      {expedientesDoDia.length > 0 ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {URGENCY_SECTIONS.map(({ key, label, color }) => {
                const items = groups[key];
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <UrgencySection label={label} color={color} count={items.length} />
                    <div className="space-y-1.5">
                      {items.map((expediente) => {
                        const status = getStatus(expediente);
                        const partes = getExpedientePartyNames(expediente);
                        const urgencyBorder = URGENCY_BORDER[key];

                        return (
                          <GlassPanel
                            key={expediente.id}
                            depth={1}
                            className={cn(
                              'p-3 hover:border-primary/30 hover:bg-accent/50 transition-colors space-y-1.5 group',
                              urgencyBorder
                            )}
                          >
                            {/* Primeira linha: numero do processo + badge status */}
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {expediente.numeroProcesso}
                              </span>
                              <AppBadge variant={status.variant} className="shrink-0 text-[10px] px-1.5 py-0">
                                {status.label}
                              </AppBadge>
                            </div>

                            {/* Segunda linha: tipo expediente + descricao arquivos */}
                            <div className="text-[11px]">
                              <span className="text-muted-foreground/70">
                                {(expediente as Expediente & { tipoExpediente?: { tipoExpediente?: string } }).tipoExpediente?.tipoExpediente || 'Sem tipo'}
                              </span>
                              {expediente.descricaoArquivos && (
                                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-muted-foreground/55">
                                  {expediente.descricaoArquivos}
                                </p>
                              )}
                            </div>

                            {/* Terceira linha: partes */}
                            <div className="pt-2 mt-2 border-t border-border/10 text-[11px] text-muted-foreground/55 truncate">
                              {partes.autora || '-'}
                              {' vs '}
                              {partes.re || '-'}
                            </div>

                            {/* CTA buttons on hover */}
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onViewDetail?.(expediente)}
                                className="px-2 py-0.5 rounded-md bg-primary/6 text-primary text-[10px] font-medium hover:bg-primary/12 transition-colors cursor-pointer"
                              >
                                Detalhes
                              </button>
                            </div>
                          </GlassPanel>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer com contagem */}
          <div className="px-4 py-2 border-t bg-muted/20">
            <AppBadge variant="secondary" className="text-xs">
              {expedientesDoDia.length} {expedientesDoDia.length === 1 ? 'expediente' : 'expedientes'}
            </AppBadge>
          </div>
        </>
      ) : (
        /* Empty state */
        <EmptyState
          icon={Calendar}
          title="Nenhum expediente neste dia"
          description="Nao ha expedientes agendados para esta data."
          action={onAddExpediente ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddExpediente}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Expediente
            </Button>
          ) : undefined}
          className="flex-1"
        />
      )}
    </div>
  );
}
