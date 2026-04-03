/**
 * AudienciasMesView — Month calendar em GlassPanel
 * ============================================================================
 * Reutiliza AudienciasCalendarMonthView internamente, envolvendo em Glass.
 * Adiciona navegação de mês e integração com o layout unificado.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { Audiencia } from '../../domain';
import { AudienciasCalendarMonthView } from '../audiencias-calendar-month-view';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasMesViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  refetch: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasMesView({
  audiencias,
  currentDate,
  onDateChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onViewDetail,
  refetch,
}: AudienciasMesViewProps) {
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
  }, [currentDate]);

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentMonth ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{monthLabel}</span>
      </div>

      {/* Calendar Grid in Glass */}
      <GlassPanel className="p-3 sm:p-4">
        <AudienciasCalendarMonthView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={onDateChange}
          refetch={refetch}
        />
      </GlassPanel>
    </div>
  );
}
