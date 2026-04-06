'use client';

import * as React from 'react';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useExpedientes } from '../hooks/use-expedientes';
import { ExpedientesCalendarCompact } from './expedientes-calendar-compact';
import { ExpedientesDayList } from './expedientes-day-list';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';

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

export interface ExpedientesMonthWrapperProps {
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

export function ExpedientesMonthWrapper({
  usuariosData = [],
  tiposExpedientesData = [],
}: ExpedientesMonthWrapperProps) {
  const {
    expedientes,
    isLoading,
    error,
    refetch,
    } = useExpedientes();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const [selectedBaixarId, setSelectedBaixarId] = React.useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [selectedExpedienteId, setSelectedExpedienteId] = React.useState<number | null>(null);

  if (isLoading) {
    return <TemporalViewLoading message="Carregando calendário..." />;
  }

  if (error) {
    return <TemporalViewError message="Erro ao carregar calendário" onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Master-Detail Layout (Mês) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="flex flex-col gap-4 h-[700px]">
          <ExpedientesCalendarCompact
            expedientes={expedientes}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        <div className="flex flex-col h-[700px] overflow-hidden">
          <ExpedientesDayList
            selectedDate={selectedDate!}
            expedientes={expedientes}
                                    
          />
        </div>
      </div>

      <ExpedienteVisualizarDialog
        expediente={expedientes.find(e => e.id === selectedExpedienteId) as any}
        open={!!selectedExpedienteId}
        onOpenChange={(open) => {
          if (!open) setSelectedExpedienteId(null);
        }}
      />
    </div>
  );
}
