'use client';

/**
 * @file obrigacoes-year-wrapper.tsx
 * @description Year view wrapper for Obrigações module
 * @module features/obrigacoes/components/calendar
 *
 * Displays a 12-month year grid with parcelas (installments) from acordos (agreements).
 * Uses DataShell + DataTableToolbar + YearFilterPopover pattern.
 * Each day with parcelas is highlighted, clicking opens a dialog with details.
 *
 * @pattern DataShell year view (following ExpedientesYearWrapper)
 */

import * as React from 'react';
import { startOfYear, endOfYear, format, parseISO } from 'date-fns';
import { DataShell, DataTableToolbar } from '@/components/shared/data-shell';
import { YearFilterPopover, TemporalViewLoading, TemporalViewError, YearCalendarGrid } from '@/components/shared';
import { FilterPopover, type FilterOption } from '@/app/(authenticated)/partes/components/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import type { AcordoComParcelas, StatusAcordo, TipoObrigacao, DirecaoPagamento, Parcela } from '../../domain';
import { STATUS_LABELS, TIPO_LABELS, DIRECAO_LABELS } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';
import { NovaObrigacaoDialog } from '../dialogs/nova-obrigacao-dialog';

interface ObrigacoesYearWrapperProps {
  viewModeSlot?: React.ReactNode;
}

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TIPO_OPTIONS: readonly FilterOption[] = Object.entries(TIPO_LABELS).map(
  ([value, label]) => ({ value, label })
);

const DIRECAO_OPTIONS: readonly FilterOption[] = Object.entries(DIRECAO_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function ObrigacoesYearWrapper({ viewModeSlot }: ObrigacoesYearWrapperProps) {
  // Year navigation
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const selectedDate = React.useMemo(() => new Date(selectedYear, 0, 1), [selectedYear]);

  // Filter state
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusAcordo | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = React.useState<TipoObrigacao | 'todos'>('todos');
  const [direcaoFilter, setDirecaoFilter] = React.useState<DirecaoPagamento | 'todos'>('todos');

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [selectedDayParcelas, setSelectedDayParcelas] = React.useState<{ parcela: Parcela; acordo: AcordoComParcelas }[]>([]);
  const [selectedDayDate, setSelectedDayDate] = React.useState<Date | null>(null);

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
        dataInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
        dataFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
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
  }, [selectedDate, statusFilter, tipoFilter, direcaoFilter, globalFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map parcelas by day (month-day key)
  const parcelasPorDia = React.useMemo(() => {
    const mapa = new Map<string, { parcela: Parcela; acordo: AcordoComParcelas }[]>();
    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
        if (!parcela.dataVencimento) return;
        const d = parseISO(parcela.dataVencimento);
        if (d.getFullYear() !== selectedYear) return;
        const key = `${d.getMonth()}-${d.getDate()}`;
        const existing = mapa.get(key) || [];
        existing.push({ parcela, acordo });
        mapa.set(key, existing);
      });
    });
    return mapa;
  }, [obrigacoes, selectedYear]);

  // Check if a day has parcelas
  const hasDayContent = React.useCallback((mes: number, dia: number) => {
    return parcelasPorDia.has(`${mes}-${dia}`);
  }, [parcelasPorDia]);

  // Handle day click to show parcelas
  const handleDiaClick = React.useCallback((mes: number, dia: number) => {
    const key = `${mes}-${dia}`;
    const items = parcelasPorDia.get(key);
    if (items && items.length > 0) {
      setSelectedDayParcelas(items);
      setSelectedDayDate(new Date(selectedYear, mes, dia));
      setDayDialogOpen(true);
    }
  }, [parcelasPorDia, selectedYear]);

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
                <YearFilterPopover
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
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
          <YearCalendarGrid
            year={selectedYear}
            hasDayContent={hasDayContent}
            onDayClick={handleDiaClick}
            className="p-6"
          />
        )}
      </DataShell>

      {/* Dialog lista do dia */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDayDate ? format(selectedDayDate, 'dd/MM/yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 p-1">
              {selectedDayParcelas.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      Parcela {item.parcela.numeroParcela} - Processo {item.acordo.processo?.numero_processo || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{item.parcela.status}</span>
                  </div>
                  <AppBadge variant={item.parcela.status === 'atrasada' ? 'destructive' : 'outline'}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.parcela.valorBrutoCreditoPrincipal)}
                  </AppBadge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <NovaObrigacaoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchData}
      />
    </>
  );
}
