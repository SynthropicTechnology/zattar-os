'use client';

/**
 * ObrigacoesMonthWrapper
 *
 * Wrapper component for the month view of "Obrigações".
 * Combines DataShell + DataTableToolbar + filters + master-detail layout
 * (compact calendar + day list).
 *
 * @example
 * ```tsx
 * <ObrigacoesMonthWrapper viewModeSlot={<ViewToggle />} />
 * ```
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DataShell, DataTableToolbar } from '@/components/shared/data-shell';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { FilterPopover, type FilterOption } from '@/app/app/partes/components/shared';
import type { AcordoComParcelas, StatusAcordo, TipoObrigacao, DirecaoPagamento } from '../../domain';
import { STATUS_LABELS, TIPO_LABELS, DIRECAO_LABELS } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';
import { ObrigacoesCalendarCompact } from './obrigacoes-calendar-compact';
import { ObrigacoesDayList } from './obrigacoes-day-list';
import { NovaObrigacaoDialog } from '../dialogs/nova-obrigacao-dialog';

/* --------------------------------- Filter Options --------------------------------- */

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TIPO_OPTIONS: readonly FilterOption[] = Object.entries(TIPO_LABELS).map(
  ([value, label]) => ({ value, label })
);

const DIRECAO_OPTIONS: readonly FilterOption[] = Object.entries(DIRECAO_LABELS).map(
  ([value, label]) => ({ value, label })
);

/* --------------------------------- Types --------------------------------- */

interface ObrigacoesMonthWrapperProps {
  viewModeSlot?: React.ReactNode;
}

/* --------------------------------- Component --------------------------------- */

export function ObrigacoesMonthWrapper({ viewModeSlot }: ObrigacoesMonthWrapperProps) {
  // Calendar state
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Filter state
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusAcordo | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = React.useState<TipoObrigacao | 'todos'>('todos');
  const [direcaoFilter, setDirecaoFilter] = React.useState<DirecaoPagamento | 'todos'>('todos');

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Data state
  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Data fetching
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
        dataFim: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        incluirSemData: false,
        status: statusFilter !== 'todos' ? statusFilter : undefined,
        tipo: tipoFilter !== 'todos' ? tipoFilter : undefined,
        direcao: direcaoFilter !== 'todos' ? direcaoFilter : undefined,
        busca: globalFilter || undefined,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao listar obrigações');
      setObrigacoes(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, statusFilter, tipoFilter, direcaoFilter, globalFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Obrigações"
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar obrigações..."
            actionButton={{
              label: 'Nova Obrigação',
              onClick: () => setIsCreateDialogOpen(true),
            }}
            actionSlot={viewModeSlot}
            filtersSlot={
              <>
                <FilterPopover
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusAcordo | 'todos')}
                  defaultValue="todos"
                />
                <FilterPopover
                  label="Tipo"
                  options={TIPO_OPTIONS}
                  value={tipoFilter}
                  onValueChange={(v) => setTipoFilter(v as TipoObrigacao | 'todos')}
                  defaultValue="todos"
                />
                <FilterPopover
                  label="Direção"
                  options={DIRECAO_OPTIONS}
                  value={direcaoFilter}
                  onValueChange={(v) => setDirecaoFilter(v as DirecaoPagamento | 'todos')}
                  defaultValue="todos"
                />
              </>
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando obrigações..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar obrigações: ${error}`} onRetry={fetchData} />
        ) : (
          <div className="bg-card border rounded-md overflow-hidden flex-1 min-h-0">
            <div className="flex h-full">
              {/* Calendário compacto — largura fixa */}
              <div className="w-[480px] shrink-0 border-r p-6 overflow-auto">
                <ObrigacoesCalendarCompact
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  obrigacoes={obrigacoes}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>

              {/* Lista do dia — ocupa todo o espaço restante */}
              <div className="flex-1 min-w-0">
                <ObrigacoesDayList
                  selectedDate={selectedDate}
                  obrigacoes={obrigacoes}
                  onAddObrigacao={() => setIsCreateDialogOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </DataShell>

      <NovaObrigacaoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchData}
      />
    </>
  );
}
