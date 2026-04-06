'use client';

import type { Expediente } from '../domain';
import { ExpedientesCalendarYear } from './expedientes-calendar-year';

export interface ExpedientesYearWrapperProps {
  expedientes: Expediente[];
  currentDate?: Date;
}

export function ExpedientesYearWrapper({
  expedientes,
  currentDate = new Date(),
}: ExpedientesYearWrapperProps) {
  return (
    <div className="flex flex-col gap-4">
      <ExpedientesCalendarYear
        currentDate={currentDate}
      />
    </div>
  );
}
