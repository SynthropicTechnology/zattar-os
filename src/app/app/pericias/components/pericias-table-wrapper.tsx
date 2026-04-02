'use client';

/**
 * PericiasTableWrapper - Wrapper auto-contido para a view de semana/lista
 *
 * Segue o padrão de ExpedientesTableWrapper refatorado:
 * - Gerencia próprio estado de filtros, paginação e fetch
 * - DataShell + DataTableToolbar + DataTable + DataPagination
 * - PericiasListFilters no filtersSlot
 * - WeekNavigator para visualização de semana
 * - usePericias hook para data fetching
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { X } from 'lucide-react';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';

import type { Pericia } from '../domain';
import { SituacaoPericiaCodigo, SITUACAO_PERICIA_LABELS } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/app/expedientes';
import type { GrauTribunal } from '../domain';
import { usePericias } from '../hooks/use-pericias';
import { useUsuarios } from '@/app/app/usuarios';
import { useEspecialidadesPericias } from '../hooks/use-especialidades-pericias';
import { usePeritos } from '../hooks/use-peritos';
import type { UsuarioOption, EspecialidadePericiaOption, PeritoOption } from '../types';

import { columns } from './columns';
import { PericiaCriarDialog } from './pericia-criar-dialog';
import {
  PericiasListFilters,
  type SituacaoFilterType,
  type ResponsavelFilterType,
  type LaudoFilterType,
} from './pericias-list-filters';

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasTableWrapperProps {
  fixedDate?: Date;
  hideDateFilters?: boolean;
  /** Props para renderizar o WeekNavigator dentro do wrapper */
  weekNavigatorProps?: Omit<WeekNavigatorProps, 'className' | 'variant'>;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioOption[];
  /** Dados de especialidades pré-carregados */
  especialidadesData?: EspecialidadePericiaOption[];
  /** Dados de peritos pré-carregados */
  peritosData?: PeritoOption[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasTableWrapper({
  fixedDate,
  hideDateFilters,
  weekNavigatorProps,
  viewModeSlot,
  usuariosData,
  especialidadesData,
  peritosData,
}: PericiasTableWrapperProps) {
  const router = useRouter();
  const isWeekMode = !!weekNavigatorProps;

  // ---------- Estado da Tabela ----------
  const [table, setTable] = React.useState<TanstackTable<Pericia> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // ---------- Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // ---------- Busca e Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [situacaoFilter, setSituacaoFilter] = React.useState<SituacaoFilterType>('todos');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [laudoFilter, setLaudoFilter] = React.useState<LaudoFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [especialidadeFilter, setEspecialidadeFilter] = React.useState('');
  const [peritoFilter, setPeritoFilter] = React.useState('');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { especialidades: especialidadesFetched } = useEspecialidadesPericias({ enabled: !especialidadesData });
  const { peritos: peritosFetched } = usePeritos({ enabled: !peritosData });

  const usuarios = usuariosData ?? usuariosFetched;
  const especialidades = especialidadesData ?? especialidadesFetched;
  const peritos = peritosData ?? peritosFetched;

  // ---------- Montar params para o hook ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: globalFilter || undefined,
    };

    // Situação
    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      // Padrão: excluir Finalizadas e Canceladas
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    // Responsável
    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    // Laudo
    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    // Date range
    if (dateRange?.from) params.prazoEntregaInicio = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to) params.prazoEntregaFim = format(dateRange.to, 'yyyy-MM-dd');

    // Fixed date (semana mode) overrides date range
    if (fixedDate) {
      const dateStr = format(fixedDate, 'yyyy-MM-dd');
      params.prazoEntregaInicio = dateStr;
      params.prazoEntregaFim = dateStr;
    }

    // Filtros avançados
    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter) params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    pageIndex, pageSize, globalFilter,
    situacaoFilter, responsavelFilter, laudoFilter,
    dateRange, fixedDate,
    tribunalFilter, grauFilter, especialidadeFilter, peritoFilter,
  ]);

  // ---------- Data Fetching ----------
  const { pericias, paginacao, isLoading, error, refetch } = usePericias(hookParams);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  // ---------- Handlers ----------
  const handleSucessoOperacao = React.useCallback(() => {
    setRowSelection({});
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
    router.refresh();
  }, [refetch, router]);

  const handleClearAllFilters = React.useCallback(() => {
    setSituacaoFilter('todos');
    setResponsavelFilter('todos');
    setLaudoFilter('todos');
    setDateRange(undefined);
    setTribunalFilter('');
    setGrauFilter('');
    setEspecialidadeFilter('');
    setPeritoFilter('');
    setPageIndex(0);
  }, []);

  // ---------- Chips de filtros ativos ----------
  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (situacaoFilter !== 'todos') {
      chips.push({
        key: 'situacao',
        label: SITUACAO_PERICIA_LABELS[situacaoFilter],
        onRemove: () => setSituacaoFilter('todos'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem responsável',
        onRemove: () => setResponsavelFilter('todos'),
      });
    } else if (typeof responsavelFilter === 'number') {
      const usuario = usuarios.find((u) => u.id === responsavelFilter);
      chips.push({
        key: 'responsavel',
        label: usuario ? (usuario.nomeExibicao || usuario.nomeCompleto || `Usuário ${usuario.id}`) : `Responsável #${responsavelFilter}`,
        onRemove: () => setResponsavelFilter('todos'),
      });
    }

    if (laudoFilter !== 'todos') {
      chips.push({
        key: 'laudo',
        label: laudoFilter === 'sim' ? 'Laudo juntado' : 'Sem laudo',
        onRemove: () => setLaudoFilter('todos'),
      });
    }

    if (dateRange?.from || dateRange?.to) {
      const fromStr = dateRange.from ? format(dateRange.from, 'dd/MM') : '';
      const toStr = dateRange.to ? format(dateRange.to, 'dd/MM') : '';
      chips.push({
        key: 'dateRange',
        label: `${fromStr} - ${toStr}`,
        onRemove: () => setDateRange(undefined),
      });
    }

    if (tribunalFilter) {
      chips.push({
        key: 'tribunal',
        label: tribunalFilter,
        onRemove: () => setTribunalFilter(''),
      });
    }

    if (grauFilter) {
      chips.push({
        key: 'grau',
        label: GRAU_TRIBUNAL_LABELS[grauFilter as GrauTribunal] || grauFilter,
        onRemove: () => setGrauFilter(''),
      });
    }

    if (especialidadeFilter) {
      const esp = especialidades.find((e) => e.id === parseInt(especialidadeFilter, 10));
      chips.push({
        key: 'especialidade',
        label: esp ? esp.descricao : `Especialidade #${especialidadeFilter}`,
        onRemove: () => setEspecialidadeFilter(''),
      });
    }

    if (peritoFilter) {
      const p = peritos.find((x) => x.id === parseInt(peritoFilter, 10));
      chips.push({
        key: 'perito',
        label: p ? p.nome : `Perito #${peritoFilter}`,
        onRemove: () => setPeritoFilter(''),
      });
    }

    return chips;
  }, [
    situacaoFilter, responsavelFilter, laudoFilter, dateRange,
    tribunalFilter, grauFilter, especialidadeFilter, peritoFilter,
    usuarios, especialidades, peritos,
  ]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          table ? (
            <>
              <DataTableToolbar
                table={table}
                title="Perícias"
                density={density}
                onDensityChange={setDensity}
                searchValue={globalFilter}
                onSearchValueChange={(value: string) => {
                  setGlobalFilter(value);
                  setPageIndex(0);
                }}
                searchPlaceholder="Buscar perícias..."
                viewModeSlot={viewModeSlot}
                actionButton={{
                  label: 'Nova Perícia',
                  onClick: () => setIsCreateDialogOpen(true),
                }}
                filtersSlot={
                  <>
                    <PericiasListFilters
                      situacaoFilter={situacaoFilter}
                      onSituacaoChange={(v) => { setSituacaoFilter(v); setPageIndex(0); }}
                      responsavelFilter={responsavelFilter}
                      onResponsavelChange={(v) => { setResponsavelFilter(v); setPageIndex(0); }}
                      laudoFilter={laudoFilter}
                      onLaudoChange={(v) => { setLaudoFilter(v); setPageIndex(0); }}
                      tribunalFilter={tribunalFilter}
                      onTribunalChange={(v) => { setTribunalFilter(v); setPageIndex(0); }}
                      grauFilter={grauFilter}
                      onGrauChange={(v) => { setGrauFilter(v); setPageIndex(0); }}
                      especialidadeFilter={especialidadeFilter}
                      onEspecialidadeChange={(v) => { setEspecialidadeFilter(v); setPageIndex(0); }}
                      peritoFilter={peritoFilter}
                      onPeritoChange={(v) => { setPeritoFilter(v); setPageIndex(0); }}
                      usuarios={usuarios}
                      especialidades={especialidades}
                      peritos={peritos}
                      hideAdvancedFilters={isWeekMode}
                    />

                    {/* Date filters (oculto em modo semana) */}
                    {!hideDateFilters && !fixedDate && (
                      <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                          setDateRange(range);
                          setPageIndex(0);
                        }}
                        placeholder="Prazo entrega"
                        className="h-9 w-60 bg-card"
                      />
                    )}
                  </>
                }
              />

              {/* Week Navigator */}
              {weekNavigatorProps && (
                <div className="pb-3">
                  <WeekNavigator
                    weekDays={weekNavigatorProps.weekDays}
                    selectedDate={weekNavigatorProps.selectedDate}
                    onDateSelect={weekNavigatorProps.onDateSelect}
                    onPreviousWeek={weekNavigatorProps.onPreviousWeek}
                    onNextWeek={weekNavigatorProps.onNextWeek}
                    onToday={weekNavigatorProps.onToday}
                    isCurrentWeek={weekNavigatorProps.isCurrentWeek}
                  />
                </div>
              )}

              {/* Active Filter Chips */}
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                  {activeFilterChips.map((chip) => (
                    <AppBadge
                      key={chip.key}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                      onClick={() => chip.onRemove()}
                    >
                      {chip.label}
                      <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-sm hover:bg-background/40"
                        onClick={(e) => {
                          e.stopPropagation();
                          chip.onRemove();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </AppBadge>
                  ))}
                  {activeFilterChips.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleClearAllFilters}
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : undefined
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={pericias}
          columns={columns}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Pericia>)}
          emptyMessage="Nenhuma perícia encontrada."
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          options={{
            meta: {
              usuarios,
              onSuccess: handleSucessoOperacao,
            },
          }}
        />
      </DataShell>

      <PericiaCriarDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        usuarios={usuarios}
        especialidades={especialidades}
        peritos={peritos}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
