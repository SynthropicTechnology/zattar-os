'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { isSameDay, parseISO } from 'date-fns';
import { staggerContainer } from '@/components/ui/animations';
import {
  getCalendarCells,
  calculateMonthEventPositions,
} from '@/components/calendar/helpers'; // Reusing helper functions
import type { IEvent } from '@/components/calendar/interfaces';
import type { Audiencia, StatusAudiencia } from '../domain';
import { AudienciasMonthDayCell } from './audiencias-month-day-cell';
import { AudienciasDiaDialog } from './audiencias-dia-dialog';
import { getSemanticBadgeVariant } from '@/lib/design-system';

interface ICalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color?: string;
  originalAudiencia: Audiencia;
}

interface AudienciasCalendarMonthViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Mapeia status de audiência para cor do calendário usando design system.
 * Traduz as variantes semânticas para as cores esperadas pelo componente de calendário.
 */
function getCalendarColor(status: StatusAudiencia | string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' {
  const variant = getSemanticBadgeVariant('audiencia_status', status);
  const variantToColor: Record<string, 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'> = {
    info: 'blue',        // Marcada
    success: 'green',    // Finalizada
    destructive: 'red',  // Cancelada
    warning: 'yellow',   // Adiada/Reagendada
  };
  return variantToColor[variant] ?? 'blue';
}

function audienciaToICalendarEvent(audiencia: Audiencia): ICalendarEvent {
  return {
    id: audiencia.id.toString(),
    title: audiencia.numeroProcesso,
    startDate: audiencia.dataInicio,
    endDate: audiencia.dataFim,
    allDay: false,
    originalAudiencia: audiencia,
    color: getCalendarColor(audiencia.status),
  };
}

// Converter ICalendarEvent para IEvent para compatibility com calculateMonthEventPositions
function toIEvent(event: ICalendarEvent): IEvent {
  return {
    id: Number(event.id),
    startDate: event.startDate,
    endDate: event.endDate,
    title: event.title,
    color: (event.color || 'blue') as 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange',
    description: '',
    user: { id: '0', name: '', picturePath: null },
  };
}

export function AudienciasCalendarMonthView({
  audiencias,
  currentDate,
  onDateChange: _onDateChange,
  refetch: _refetch,
}: AudienciasCalendarMonthViewProps) {
  // onDateChange and refetch are reserved for future use
  void _onDateChange;
  const cells = useMemo(() => getCalendarCells(currentDate), [currentDate]);
  const iEvents = useMemo(() => audiencias.map(audienciaToICalendarEvent), [audiencias]);

  // We need to split iEvents into multi-day and single-day for calculateMonthEventPositions
  const multiDayEvents = useMemo(() => iEvents.filter(e => !isSameDay(parseISO(e.startDate), parseISO(e.endDate))), [iEvents]);
  const singleDayEvents = useMemo(() => iEvents.filter(e => isSameDay(parseISO(e.startDate), parseISO(e.endDate))), [iEvents]);

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(
      multiDayEvents.map(toIEvent), 
      singleDayEvents.map(toIEvent), 
      currentDate
    ),
    [multiDayEvents, singleDayEvents, currentDate]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [audienciasDia, setAudienciasDia] = useState<Audiencia[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());

  const handleOpenDiaDialog = (date: Date, audienciasDoDia: Audiencia[]) => {
    setDataSelecionada(date);
    setAudienciasDia(audienciasDoDia);
    setDialogOpen(true);
  };

  const handleAddAudiencia = (date: Date) => {
    console.log("Add Audiencia for date:", date);
    // Open a form for creating new audiencia
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer}>
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Header dias da semana */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {WEEK_DAYS.map((day, index) => (
            <motion.div
              key={day}
              className="flex items-center justify-center py-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
            >
              <span className="text-xs font-medium text-t-quaternary">{day}</span>
            </motion.div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          // Filter audiencias relevant for this specific cell's day
          const audienciasForCell = audiencias.filter(aud =>
            isSameDay(parseISO(aud.dataInicio), cell.date) ||
            isSameDay(parseISO(aud.dataFim), cell.date) ||
            (parseISO(aud.dataInicio) < cell.date && parseISO(aud.dataFim) > cell.date)
          );

          return (
            <AudienciasMonthDayCell
              key={index}
              cell={cell}
              audiencias={audienciasForCell}
              eventPositions={eventPositions}
              onOpenDayDialog={() => handleOpenDiaDialog(cell.date, audienciasForCell)}
              onAddAudiencia={handleAddAudiencia}
            />
          );
        })}
        </div>
      </div>
      <AudienciasDiaDialog
        audiencias={audienciasDia}
        data={dataSelecionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={_refetch}
      />
    </motion.div>
  );
}
