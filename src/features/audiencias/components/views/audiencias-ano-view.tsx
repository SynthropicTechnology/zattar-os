/**
 * AudienciasAnoView — Year calendar heatmap em GlassPanel
 * ============================================================================
 * Reutiliza AudienciasCalendarYearView internamente, envolvendo em Glass.
 * Adiciona navegação de ano e integração com o layout unificado.
 * ============================================================================
 */

'use client';


import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/app/app/dashboard/mock/widgets/primitives';
import type { Audiencia } from '../../domain';
import { AudienciasCalendarYearView } from '../audiencias-calendar-year-view';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasAnoViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  refetch: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasAnoView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail: _onViewDetail,
  refetch,
}: AudienciasAnoViewProps) {
  const year = currentDate.getFullYear();
  const isCurrentYear = year === new Date().getFullYear();

  const handlePrevYear = () => onDateChange(new Date(year - 1, currentDate.getMonth(), 1));
  const handleNextYear = () => onDateChange(new Date(year + 1, currentDate.getMonth(), 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="space-y-4">
      {/* Year Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrevYear} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentYear ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextYear} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium ml-1">{year}</span>
      </div>

      {/* Year Grid in Glass */}
      <GlassPanel className="p-3 sm:p-5">
        <AudienciasCalendarYearView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={onDateChange}
          refetch={refetch}
        />
      </GlassPanel>
    </div>
  );
}
