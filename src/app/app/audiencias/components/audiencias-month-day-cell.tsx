import { isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ICalendarCell } from '@/components/calendar/interfaces'; // Reusing ICalendarCell
import type { Audiencia } from '../domain';
import { AudienciaCard } from './audiencia-card'; // Reusing AudienciaCard
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { transition } from '@/components/ui/animations';

interface AudienciasMonthDayCellProps {
  cell: ICalendarCell;
  audiencias: Audiencia[];
  eventPositions: Record<string, number>;
  onOpenDayDialog: () => void;
  onAddAudiencia: (date: Date) => void;
}

const MAX_VISIBLE_AUDIENCIAS = 2; // Maximum number of compact cards to show

export const AudienciasMonthDayCell = ({
  cell,
  audiencias,
  eventPositions,
  onOpenDayDialog,
  onAddAudiencia,
}: AudienciasMonthDayCellProps) => {
  const { day, currentMonth, date } = cell;

  // Audiências já filtradas pelo componente pai (AudienciasCalendarMonthView)
  // Apenas adiciona posição e ordena
  const dayAudiencias = useMemo(() => {
    return audiencias.map(aud => ({
      ...aud,
      position: eventPositions[aud.id.toString()] ?? -1,
    })).sort((a,b) => {
      // Sort by position and then by start time
      if (a.position !== b.position) return a.position - b.position;
      return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
    });
  }, [audiencias, eventPositions]);


  const visibleAudiencias = dayAudiencias.slice(0, MAX_VISIBLE_AUDIENCIAS);
  const moreAudienciasCount = dayAudiencias.length - MAX_VISIBLE_AUDIENCIAS;

  return (
    <motion.div
      className={cn(
        'flex h-full min-h-[120px] flex-col gap-1 border-b border-r p-1 text-sm sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]',
        !currentMonth && 'bg-muted/30 text-muted-foreground',
        isToday(date) && 'bg-accent/20',
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
            isToday(date) && 'bg-primary text-primary-foreground',
            !currentMonth && 'text-muted-foreground/70'
          )}
        >
          {day}
        </span>
        {dayAudiencias.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {dayAudiencias.length} audiência{dayAudiencias.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col grow gap-1 overflow-hidden">
        {visibleAudiencias.map((aud) => (
          <AudienciaCard
            key={aud.id}
            audiencia={aud}
            compact
            onClick={() => onOpenDayDialog()}
          />
        ))}
        {moreAudienciasCount > 0 && (
          <button
            type="button"
            className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={onOpenDayDialog}
          >
            +{moreAudienciasCount} mais...
          </button>
        )}
        {currentMonth && dayAudiencias.length === 0 && (
           <Button
             variant="ghost"
             size="icon"
             className="w-full h-full flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity duration-200"
             onClick={() => onAddAudiencia(date)}
           >
             <Plus className="h-4 w-4" />
           </Button>
         )}
      </div>
    </motion.div>
  );
};
