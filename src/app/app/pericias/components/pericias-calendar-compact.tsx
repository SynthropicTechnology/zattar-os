'use client';

/**
 * PericiasCalendarCompact - Calendário compacto com navegação de mês integrada
 *
 * Componente para exibição em layout master-detail.
 * Mostra um calendário mensal compacto à esquerda com indicadores
 * de dias que possuem perícias.
 */

import * as React from 'react';
import {
  format,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCalendarCells } from '@/components/calendar/helpers';
import { SituacaoPericiaCodigo, type Pericia } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasCalendarCompactProps {
  /** Data selecionada (dia) */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Perícias para contar/destacar dias */
  pericias: Pericia[];
  /** Mês sendo exibido */
  currentMonth: Date;
  /** Callback quando mês muda */
  onMonthChange: (date: Date) => void;
  /** Classes CSS adicionais */
  className?: string;
}

// Dias da semana em português (abreviados)
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Retorna a classe CSS de background para o indicador de status da perícia.
 * - Aguardando Laudo (L): bg-primary (azul)
 * - Laudo Juntado (P): bg-info (azul)
 * - Aguardando Esclarecimentos (S): bg-warning (amarelo)
 * - Finalizada (F): bg-success (verde)
 * - Cancelada (C): bg-destructive (vermelho)
 * - Redesignada (R): bg-muted-foreground (cinza)
 */
function getStatusIndicatorClass(situacao: SituacaoPericiaCodigo): string {
  const statusToClass: Record<SituacaoPericiaCodigo, string> = {
    [SituacaoPericiaCodigo.AGUARDANDO_LAUDO]: 'bg-primary',
    [SituacaoPericiaCodigo.LAUDO_JUNTADO]: 'bg-info',
    [SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]: 'bg-warning',
    [SituacaoPericiaCodigo.FINALIZADA]: 'bg-success',
    [SituacaoPericiaCodigo.CANCELADA]: 'bg-destructive',
    [SituacaoPericiaCodigo.REDESIGNADA]: 'bg-muted-foreground',
  };
  return statusToClass[situacao] ?? 'bg-primary';
}

/**
 * Verifica se uma perícia está vencida (prazo passado e não foi juntado laudo nem finalizada).
 */
function isOverdue(pericia: Pericia): boolean {
  if (!pericia.prazoEntrega) return false;
  const prazo = parseISO(pericia.prazoEntrega);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isLate = prazo < today;
  const isPending =
    pericia.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO ||
    pericia.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS;

  return isLate && isPending;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasCalendarCompact({
  selectedDate,
  onDateSelect,
  pericias,
  currentMonth,
  onMonthChange,
  className,
}: PericiasCalendarCompactProps) {
  // Gerar células do calendário
  const cells = React.useMemo(() => getCalendarCells(currentMonth), [currentMonth]);

  // Mapa de perícias por dia (ISO date string -> pericias[])
  const periciasByDay = React.useMemo(() => {
    const map = new Map<string, Pericia[]>();
    pericias.forEach((pericia) => {
      // Só inclui perícias que tenham prazo de entrega
      if (!pericia.prazoEntrega) return;

      const dateKey = format(parseISO(pericia.prazoEntrega), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      existing.push(pericia);
      map.set(dateKey, existing);
    });
    return map;
  }, [pericias]);

  // Handlers de navegação
  const handlePreviousMonth = React.useCallback(() => {
    onMonthChange(subMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleNextMonth = React.useCallback(() => {
    onMonthChange(addMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleGoToToday = React.useCallback(() => {
    const today = new Date();
    onMonthChange(today);
    onDateSelect(today);
  }, [onMonthChange, onDateSelect]);

  // Texto do mês/ano (ex: "Fevereiro 2026")
  const monthYearText = React.useMemo(() => {
    const monthName = format(currentMonth, 'MMMM', { locale: ptBR });
    const year = format(currentMonth, 'yyyy');
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  }, [currentMonth]);

  // Verificar se o mês atual contém hoje
  const isCurrentMonth = React.useMemo(() => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  }, [currentMonth]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header: Navegação de mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Botão mês anterior */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors p-0"
                variant="ghost"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mês anterior</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mês anterior</TooltipContent>
          </Tooltip>

          {/* Mês/Ano */}
          <span className="text-sm font-medium text-foreground select-none min-w-32 text-center">
            {monthYearText}
          </span>

          {/* Botão próximo mês */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors p-0"
                variant="ghost"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Próximo mês</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Próximo mês</TooltipContent>
          </Tooltip>
        </div>

        {/* Botão Hoje */}
        {!isCurrentMonth && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs bg-card border shadow-sm hover:bg-accent hover:text-accent-foreground"
            onClick={handleGoToToday}
          >
            Hoje
          </Button>
        )}
      </div>

      {/* Grid do calendário */}
      <div className="border rounded-md overflow-hidden">
        {/* Header: Dias da semana */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center py-2"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Corpo: Dias do mês */}
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const dateKey = format(cell.date, 'yyyy-MM-dd');
            const dayPericias = periciasByDay.get(dateKey) || [];
            const hasPericias = dayPericias.length > 0;
            const isSelected = isSameDay(cell.date, selectedDate);
            const isTodayDate = isToday(cell.date);

            // Determinar cor do indicador baseado na prioridade:
            // Vencido (não juntado) > Aguardando Laudo > Aguardando Esclarecimentos > Laudo Juntado > Finalizada
            let indicatorColor = 'bg-primary';
            if (hasPericias) {
              const hasOverdue = dayPericias.some(isOverdue);
              const hasAguardandoLaudo = dayPericias.some(
                (p) => p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO
              );
              const hasAguardandoEsclarecimentos = dayPericias.some(
                (p) => p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS
              );
              const hasLaudoJuntado = dayPericias.some(
                (p) => p.situacaoCodigo === SituacaoPericiaCodigo.LAUDO_JUNTADO
              );
              const hasFinalizada = dayPericias.some(
                (p) => p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA
              );

              // Prioridade: Vencido > Aguardando > Esclarecimentos > Juntado > Finalizada
              if (hasOverdue) {
                indicatorColor = 'bg-destructive';
              } else if (hasAguardandoLaudo) {
                indicatorColor = getStatusIndicatorClass(SituacaoPericiaCodigo.AGUARDANDO_LAUDO);
              } else if (hasAguardandoEsclarecimentos) {
                indicatorColor = getStatusIndicatorClass(SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS);
              } else if (hasLaudoJuntado) {
                indicatorColor = getStatusIndicatorClass(SituacaoPericiaCodigo.LAUDO_JUNTADO);
              } else if (hasFinalizada) {
                indicatorColor = getStatusIndicatorClass(SituacaoPericiaCodigo.FINALIZADA);
              }
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => onDateSelect(cell.date)}
                className={cn(
                  'relative flex flex-col items-center justify-center py-2 transition-colors',
                  'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  // Bordas
                  index % 7 !== 6 && 'border-r',
                  index < cells.length - 7 && 'border-b',
                  // Estados
                  !cell.currentMonth && 'text-muted-foreground/50 bg-muted/20',
                  cell.currentMonth && !isSelected && !isTodayDate && 'text-foreground',
                  isTodayDate && !isSelected && 'font-semibold text-primary',
                  isSelected && 'bg-primary text-primary-foreground font-semibold'
                )}
              >
                {/* Número do dia */}
                <span
                  className={cn(
                    'text-sm leading-none',
                    isTodayDate && !isSelected && 'h-6 w-6 flex items-center justify-center rounded-full ring-1 ring-primary'
                  )}
                >
                  {cell.day}
                </span>

                {/* Indicador de perícias */}
                {hasPericias && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : indicatorColor
                      )}
                    />
                    {dayPericias.length > 1 && (
                      <span
                        className={cn(
                          'text-[10px] leading-none',
                          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {dayPericias.length}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass(SituacaoPericiaCodigo.AGUARDANDO_LAUDO))} />
          <span>Aguardando Laudo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass(SituacaoPericiaCodigo.LAUDO_JUNTADO))} />
          <span>Laudo Juntado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass(SituacaoPericiaCodigo.FINALIZADA))} />
          <span>Finalizada</span>
        </div>
      </div>
    </div>
  );
}
