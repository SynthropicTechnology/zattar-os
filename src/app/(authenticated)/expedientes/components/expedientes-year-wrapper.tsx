'use client';

import * as React from 'react';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useExpedientes } from '../hooks/use-expedientes';
import { ExpedientesCalendarYear } from './expedientes-calendar-year';

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export interface ExpedientesYearWrapperProps {
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

export function ExpedientesYearWrapper({
  usuariosData = [],
  tiposExpedientesData = [],
}: ExpedientesYearWrapperProps) {
  const {
    expedientes,
    isLoading,
    error,
    refetch,
    selectedDate,
    setSelectedDate,
  } = useExpedientes();

  if (isLoading) {
    return <TemporalViewLoading message="Carregando visão anual..." />;
  }

  if (error) {
    return <TemporalViewError message="Erro ao carregar ano" onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ExpedientesCalendarYear
        expedientes={expedientes}
        currentDate={selectedDate!}
        onDateSelect={setSelectedDate}
      />
    </div>
  );
}
