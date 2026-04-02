'use client';

import * as React from 'react';
import { format } from 'date-fns';

import type { PaginatedResponse } from '@/types';
import type { Pericia, ListarPericiasParams, PericiasFilters } from '../domain';
import { actionListarPericias } from '../actions/pericias-actions';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import { YearCalendarGrid } from '@/components/shared/year-calendar-grid';

interface PericiasCalendarYearProps {
  currentDate: Date;
  globalFilter?: string;
  situacaoCodigo?: PericiasFilters['situacaoCodigo'];
  trt?: PericiasFilters['trt'];
  grau?: PericiasFilters['grau'];
  responsavelId?: PericiasFilters['responsavelId'];
  semResponsavel?: PericiasFilters['semResponsavel'];
  especialidadeId?: PericiasFilters['especialidadeId'];
  peritoId?: PericiasFilters['peritoId'];
  laudoJuntado?: PericiasFilters['laudoJuntado'];
  onLoadingChange?: (loading: boolean) => void;
}

export function PericiasCalendarYear({
  currentDate,
  globalFilter = '',
  situacaoCodigo,
  trt,
  grau,
  responsavelId,
  semResponsavel,
  especialidadeId,
  peritoId,
  laudoJuntado,
  onLoadingChange,
}: PericiasCalendarYearProps) {
  const [data, setData] = React.useState<PaginatedResponse<Pericia> | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [periciasDia, setPericiasDia] = React.useState<Pericia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const pericias = React.useMemo(() => data?.data || [], [data]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);

      const params: ListarPericiasParams = {
        pagina: 1,
        limite: 1000,
        busca: globalFilter || undefined,
      };

      const filters: PericiasFilters = {
        prazoEntregaInicio: format(start, 'yyyy-MM-dd'),
        prazoEntregaFim: format(end, 'yyyy-MM-dd'),
        situacaoCodigo,
        trt,
        grau,
        responsavelId,
        semResponsavel,
        especialidadeId,
        peritoId,
        laudoJuntado,
      };

      const result = await actionListarPericias({ ...params, ...filters });
      if (!result.success) throw new Error(result.message || 'Erro ao listar perícias');
      setData(result.data as PaginatedResponse<Pericia>);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentDate,
    globalFilter,
    situacaoCodigo,
    trt,
    grau,
    responsavelId,
    semResponsavel,
    especialidadeId,
    peritoId,
    laudoJuntado,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periciasPorDia = React.useMemo(() => {
    const mapa = new Set<string>();
    pericias.forEach((p) => {
      if (!p.prazoEntrega) return;
      const d = new Date(p.prazoEntrega);
      if (d.getFullYear() === currentDate.getFullYear()) {
        mapa.add(`${d.getMonth()}-${d.getDate()}`);
      }
    });
    return mapa;
  }, [pericias, currentDate]);

  const hasDayContent = React.useCallback(
    (mes: number, dia: number) => periciasPorDia.has(`${mes}-${dia}`),
    [periciasPorDia],
  );

  const handleDiaClick = React.useCallback(
    (mes: number, dia: number) => {
      const ano = currentDate.getFullYear();
      const ps = pericias.filter((p) => {
        if (!p.prazoEntrega) return false;
        const d = new Date(p.prazoEntrega);
        return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia;
      });
      if (ps.length > 0) {
        setPericiasDia(ps);
        setDialogOpen(true);
      }
    },
    [pericias, currentDate],
  );

  return (
    <div className="flex flex-col h-full">
      <YearCalendarGrid
        year={currentDate.getFullYear()}
        hasDayContent={hasDayContent}
        onDayClick={handleDiaClick}
      />

      <PericiaDetalhesDialog
        pericia={null}
        pericias={periciasDia}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
