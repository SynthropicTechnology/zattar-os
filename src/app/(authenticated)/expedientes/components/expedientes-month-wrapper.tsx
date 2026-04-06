'use client';

import * as React from 'react';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useExpedientes } from '../hooks/use-expedientes';
import { ExpedientesCalendarCompact } from './expedientes-calendar-compact';
import { ExpedientesDayList } from './expedientes-day-list';
import { ExpedienteDialog } from './expediente-dialog';

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
    selectedDate,
    setSelectedDate,
  } = useExpedientes();

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
          />
        </div>

        <div className="flex flex-col h-[700px] overflow-hidden">
          <ExpedientesDayList
            selectedDate={selectedDate!}
            expedientes={expedientes}
            usuarios={usuariosData}
            tipos={tiposExpedientesData}
            onEdit={setSelectedExpedienteId}
          />
        </div>
      </div>

      <ExpedienteDialog
        expedienteId={selectedExpedienteId || undefined}
        open={!!selectedExpedienteId || isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExpedienteId(null);
            setIsCreateDialogOpen(false);
          }
        }}
        onSuccess={() => refetch()}
        usuarios={usuariosData}
        tipos={tiposExpedientesData}
      />
    </div>
  );
}
