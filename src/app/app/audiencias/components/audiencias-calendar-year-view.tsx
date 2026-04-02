'use client';

import * as React from 'react';
import { getYear } from 'date-fns';

import type { Audiencia } from '../domain';
import { AudienciasDiaDialog } from './audiencias-dia-dialog';
import { YearCalendarGrid } from '@/components/shared/year-calendar-grid';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasCalendarYearViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasCalendarYearView({
  audiencias,
  currentDate,
  refetch,
}: AudienciasCalendarYearViewProps) {
  const currentYear = getYear(currentDate);

  // Estado do diálogo
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dataSelecionada, setDataSelecionada] = React.useState<Date>(new Date());

  // Mapa de audiências por dia para lookup rápido
  const audienciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Audiencia[]>();
    audiencias.forEach((aud) => {
      const d = new Date(aud.dataInicio);
      if (d.getFullYear() === currentYear) {
        const key = `${d.getMonth()}-${d.getDate()}`;
        const lista = mapa.get(key) || [];
        lista.push(aud);
        mapa.set(key, lista);
      }
    });
    return mapa;
  }, [audiencias, currentYear]);

  // Verifica se um dia tem audiências
  const hasDayContent = React.useCallback(
    (mes: number, dia: number) => audienciasPorDia.has(`${mes}-${dia}`),
    [audienciasPorDia],
  );

  // Handler para clique no dia
  const handleDiaClick = React.useCallback(
    (mes: number, dia: number) => {
      const auds = audienciasPorDia.get(`${mes}-${dia}`) || [];
      if (auds.length > 0) {
        setAudienciasDia(auds);
        setDataSelecionada(new Date(currentYear, mes, dia));
        setDialogOpen(true);
      }
    },
    [audienciasPorDia, currentYear],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
      <YearCalendarGrid
        year={currentYear}
        hasDayContent={hasDayContent}
        onDayClick={handleDiaClick}
      />

      {/* Diálogo com audiências do dia (wizard) */}
      <AudienciasDiaDialog
        audiencias={audienciasDia}
        data={dataSelecionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
