'use client';

import * as React from 'react';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';
import type { PaginatedResponse } from '@/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { format } from 'date-fns';
import { YearCalendarGrid } from '@/components/shared/year-calendar-grid';

interface ExpedientesCalendarYearProps {
  /** Data de referência passada pelo parent (ExpedientesContent) */
  currentDate: Date;
  /** Filtro de status controlado pelo parent */
  statusFilter?: 'todos' | 'pendentes' | 'baixados';
  /** Filtro de busca controlado pelo parent */
  globalFilter?: string;
  /** Callback quando os dados são atualizados (para sincronizar loading state) */
  onLoadingChange?: (loading: boolean) => void;
}

export function ExpedientesCalendarYear({
  currentDate,
  statusFilter = 'pendentes',
  globalFilter = '',
  onLoadingChange,
}: ExpedientesCalendarYearProps) {
  const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [expedientesDia, setExpedientesDia] = React.useState<Expediente[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Notify parent about loading state changes
  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Derived - memoize to prevent unnecessary re-renders
  const expedientes = React.useMemo(() => data?.data || [], [data]);

  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && !e.dataPrazoLegalParte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true),
    [expedientes]
  );

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);

      const params: ListarExpedientesParams = {
        pagina: 1,
        limite: 1000,
        busca: globalFilter || undefined,
      };
      const filters: ExpedientesFilters = {
        dataPrazoLegalInicio: format(start, 'yyyy-MM-dd'),
        dataPrazoLegalFim: format(end, 'yyyy-MM-dd'),
        // Preserva comportamento legado: itens "sem prazo" devem aparecer no calendário
        // mesmo quando aplicamos filtro de range por data de prazo.
        incluirSemPrazo: true,
      };

      if (statusFilter === 'pendentes') filters.baixado = false;
      if (statusFilter === 'baixados') filters.baixado = true;

      const result = await actionListarExpedientes({ ...params, ...filters });
      if (result.success) setData(result.data as PaginatedResponse<Expediente>);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, globalFilter, statusFilter]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Set<string>();
    expedientes.forEach(e => {
      if (!e.dataPrazoLegalParte) return;
      const d = new Date(e.dataPrazoLegalParte);
      if (d.getFullYear() === currentDate.getFullYear()) {
        mapa.add(`${d.getMonth()}-${d.getDate()}`);
      }
    });
    return mapa;
  }, [expedientes, currentDate]);

  const hasDayContent = React.useCallback(
    (mes: number, dia: number) => {
      // Legacy logic: if pinned items exist, every day is marked.
      if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;
      return expedientesPorDia.has(`${mes}-${dia}`);
    },
    [expedientesPorDia, semPrazoPendentes, vencidosPendentes],
  );

  const handleDiaClick = React.useCallback(
    (mes: number, dia: number) => {
      const ano = currentDate.getFullYear();
      const doDia = expedientes.filter(e => {
        if (!e.dataPrazoLegalParte) return false;
        const d = new Date(e.dataPrazoLegalParte);
        return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia;
      });
      // Add pinned
      const pinned = [...semPrazoPendentes, ...vencidosPendentes];
      // Filter duplicates if any
      const unique = new Map();
      [...pinned, ...doDia].forEach(e => unique.set(e.id, e));
      const exps = Array.from(unique.values());
      if (exps.length > 0) {
        setExpedientesDia(exps);
        setDialogOpen(true);
      }
    },
    [expedientes, currentDate, semPrazoPendentes, vencidosPendentes],
  );

  return (
    <div className="flex flex-col h-full">
      <YearCalendarGrid
        year={currentDate.getFullYear()}
        hasDayContent={hasDayContent}
        onDayClick={handleDiaClick}
      />

      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDia}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
