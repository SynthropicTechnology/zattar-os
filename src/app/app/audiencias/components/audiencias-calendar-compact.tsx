'use client';

/**
 * AudienciasCalendarCompact - Calendário compacto com navegação de mês integrada
 *
 * Componente para exibição em layout master-detail.
 * Mostra um calendário mensal compacto à esquerda com indicadores
 * de dias que possuem audiências.
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
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { StatusAudiencia, type Audiencia } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasCalendarCompactProps {
  /** Data selecionada (dia) */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Audiências para contar/destacar dias */
  audiencias: Audiencia[];
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
 * Retorna a classe CSS de background para o indicador de status.
 * Usa o design system para determinar a variante e mapeia para classes de cor.
 */
function getStatusIndicatorClass(status: StatusAudiencia | string): string {
  const variant = getSemanticBadgeVariant('audiencia_status', status);
  const variantToClass: Record<string, string> = {
    info: 'bg-info',        // Marcada (azul)
    success: 'bg-success',  // Finalizada (verde)
    destructive: 'bg-destructive', // Cancelada (vermelho)
    warning: 'bg-warning',  // Adiada/Reagendada
    neutral: 'bg-muted-foreground',
  };
  return variantToClass[variant] ?? 'bg-primary';
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasCalendarCompact({
  selectedDate,
  onDateSelect,
  audiencias,
  currentMonth,
  onMonthChange,
  className,
}: AudienciasCalendarCompactProps) {
  // Gerar células do calendário
  const cells = React.useMemo(() => getCalendarCells(currentMonth), [currentMonth]);

  // Mapa de audiências por dia (ISO date string -> audiencias[])
  const audienciasByDay = React.useMemo(() => {
    const map = new Map<string, Audiencia[]>();
    audiencias.forEach((aud) => {
      const dateKey = format(parseISO(aud.dataInicio), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      existing.push(aud);
      map.set(dateKey, existing);
    });
    return map;
  }, [audiencias]);

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
            const dayAudiencias = audienciasByDay.get(dateKey) || [];
            const hasAudiencias = dayAudiencias.length > 0;
            const isSelected = isSameDay(cell.date, selectedDate);
            const isTodayDate = isToday(cell.date);

            // Determinar cor do indicador baseado no status predominante
            let indicatorColor = 'bg-primary';
            if (hasAudiencias) {
              const statusCounts: Record<string, number> = {};
              dayAudiencias.forEach((a) => {
                statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
              });
              // Prioridade: Marcada > Cancelada > Finalizada (usa design system)
              if (statusCounts['M']) indicatorColor = getStatusIndicatorClass('M');
              else if (statusCounts['C']) indicatorColor = getStatusIndicatorClass('C');
              else if (statusCounts['F']) indicatorColor = getStatusIndicatorClass('F');
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

                {/* Indicador de audiências */}
                {hasAudiencias && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : indicatorColor
                      )}
                    />
                    {dayAudiencias.length > 1 && (
                      <span
                        className={cn(
                          'text-[10px] leading-none',
                          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {dayAudiencias.length}
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
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass('M'))} />
          <span>Marcada</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass('F'))} />
          <span>Realizada</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('w-2 h-2 rounded-full', getStatusIndicatorClass('C'))} />
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
}
