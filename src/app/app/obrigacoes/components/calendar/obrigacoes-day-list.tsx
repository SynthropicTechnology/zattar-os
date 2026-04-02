'use client';

/**
 * ObrigacoesDayList
 *
 * Displays all obrigações (parcelas) for a selected day in the calendar master-detail view.
 * Flattens parcelas from multiple acordos and groups them by selected date.
 *
 * @component
 * @example
 * ```tsx
 * <ObrigacoesDayList
 *   selectedDate={new Date()}
 *   obrigacoes={acordosData}
 *   onAddObrigacao={() => console.log('Add new')}
 * />
 * ```
 */

import * as React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import type { AcordoComParcelas, Parcela } from '../../domain';

interface ObrigacoesDayListProps {
  selectedDate: Date;
  obrigacoes: AcordoComParcelas[];
  onAddObrigacao?: () => void;
  className?: string;
}

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

function getStatus(parcela: Parcela) {
  if (parcela.status === 'atrasada') {
    return { label: 'Vencida', variant: 'destructive' as const };
  }
  if (parcela.status === 'paga' || parcela.status === 'recebida') {
    return { label: 'Paga', variant: 'success' as const };
  }
  return { label: 'Pendente', variant: 'default' as const };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ObrigacoesDayList({
  selectedDate,
  obrigacoes,
  onAddObrigacao,
  className,
}: ObrigacoesDayListProps) {
  const parcelasDoDia = React.useMemo(() => {
    const items: ParcelaDisplay[] = [];
    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
        if (!parcela.dataVencimento) return;
        if (isSameDay(parseISO(parcela.dataVencimento), selectedDate)) {
          items.push({ parcela, acordo });
        }
      });
    });
    // Sort: atrasada first, then by parcela number
    return items.sort((a, b) => {
      if (a.parcela.status === 'atrasada' && b.parcela.status !== 'atrasada')
        return -1;
      if (a.parcela.status !== 'atrasada' && b.parcela.status === 'atrasada')
        return 1;
      return (a.parcela.numeroParcela || 0) - (b.parcela.numeroParcela || 0);
    });
  }, [obrigacoes, selectedDate]);

  const formattedDate = capitalizeFirstLetter(
    format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
  );

  const countLabel =
    parcelasDoDia.length === 1
      ? '1 parcela'
      : `${parcelasDoDia.length} parcelas`;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            {formattedDate}
          </h2>
        </div>
        {onAddObrigacao && (
          <Button size="sm" onClick={onAddObrigacao}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        )}
      </div>

      {/* Content */}
      {parcelasDoDia.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
          <div className="rounded-full bg-muted p-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma obrigação neste dia
            </p>
          </div>
          {onAddObrigacao && (
            <Button variant="outline" size="sm" onClick={onAddObrigacao}>
              <Plus className="h-4 w-4" />
              Nova Obrigação
            </Button>
          )}
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-3">
              {parcelasDoDia.map((item) => {
                const { parcela, acordo } = item;
                const status = getStatus(parcela);
                const processoNumero =
                  acordo.processo?.numero_processo || 'N/A';

                return (
                  <div
                    key={parcela.id}
                    className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            Parcela {parcela.numeroParcela} - Processo{' '}
                            {processoNumero}
                          </p>
                          <AppBadge variant={status.variant} className="text-xs">
                            {status.label}
                          </AppBadge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{acordo.tipo}</span>
                          <span>•</span>
                          <span className="font-medium">
                            {formatCurrency(parcela.valorBrutoCreditoPrincipal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <AppBadge variant="secondary" className="text-xs">
              {countLabel}
            </AppBadge>
          </div>
        </>
      )}
    </div>
  );
}
