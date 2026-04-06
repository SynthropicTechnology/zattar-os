'use client';

import * as React from 'react';
import { ExpedientesCalendarCompact } from './expedientes-calendar-compact';
import { ExpedientesDayList } from './expedientes-day-list';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import type { Expediente } from '../domain';

export interface ExpedientesMonthWrapperProps {
  expedientes: Expediente[];
  onViewDetail?: (expediente: Expediente) => void;
}

export function ExpedientesMonthWrapper({
  expedientes,
  onViewDetail,
}: ExpedientesMonthWrapperProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedExpedienteId, setSelectedExpedienteId] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Master-Detail Layout (Mês) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="flex flex-col gap-4 h-175">
          <ExpedientesCalendarCompact
            expedientes={expedientes}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        <div className="flex flex-col h-175 overflow-hidden">
          <ExpedientesDayList
            selectedDate={selectedDate}
            expedientes={expedientes}
          />
        </div>
      </div>

      <ExpedienteVisualizarDialog
        expediente={expedientes.find(e => e.id === selectedExpedienteId) ?? null}
        open={!!selectedExpedienteId}
        onOpenChange={(open) => {
          if (!open) setSelectedExpedienteId(null);
        }}
      />
    </div>
  );
}
