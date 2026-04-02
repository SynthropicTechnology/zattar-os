'use client';

/**
 * AudienciasTableWrapper - Componente Client que encapsula a tabela de audiências
 *
 * Implementação seguindo o padrão DataShell similar ao ExpedientesTableWrapper.
 * Suporta visualização de um dia específico (fixedDate) ou lista completa.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format, startOfDay, endOfDay } from 'date-fns';
import { X } from 'lucide-react';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterPopover, type FilterOption } from '@/app/app/partes/components/shared';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';

import type { CodigoTribunal, TipoAudiencia } from '../domain';
import {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CODIGO_TRIBUNAL,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
} from '../domain';
import { actionListarAudiencias } from '../actions';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/features/usuarios';

import { getAudienciasColumns, type AudienciaComResponsavel } from './audiencias-list-columns';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';
import { AudienciaDetailSheet } from './audiencia-detail-sheet';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { AudienciaForm } from './audiencia-form';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasTableWrapperProps {
  fixedDate?: Date;
  hideDateFilters?: boolean;
  /** Props para renderizar o WeekNavigator dentro do wrapper */
  weekNavigatorProps?: Omit<WeekNavigatorProps, 'className' | 'variant'>;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados (evita fetch duplicado) */
  tiposAudienciaData?: TipoAudiencia[];
}

type StatusFilterType = 'todas' | StatusAudiencia;
type ModalidadeFilterType = 'todas' | ModalidadeAudiencia;
type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;

// =============================================================================
// OPÇÕES DE FILTRO
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const MODALIDADE_OPTIONS: readonly FilterOption[] = Object.entries(MODALIDADE_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CODIGO_TRIBUNAL.map(
  (trt) => ({ value: trt, label: trt })
);

// Helper para obter nome do usuário
function getUsuarioNome(u: { id: number; nomeExibicao?: string; nomeCompleto?: string }): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasTableWrapper({
  fixedDate,
  hideDateFilters,
  weekNavigatorProps,
  viewModeSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado da Tabela (DataShell pattern) ----------
  const [table, setTable] = React.useState<TanstackTable<AudienciaComResponsavel> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado dos Dados ----------
  const [audiencias, setAudiencias] = React.useState<AudienciaComResponsavel[]>([]);

  // ---------- Estado de Filtros Primários ----------
  const [busca, setBusca] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('todas');
  const [modalidadeFilter, setModalidadeFilter] = React.useState<ModalidadeFilterType>('todas');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Estado de Filtros Secundários ----------
  const [tribunalFilter, setTribunalFilter] = React.useState<CodigoTribunal | ''>('');
  const [grauFilter, setGrauFilter] = React.useState<GrauTribunal | ''>('');
  const [tipoAudienciaFilter, setTipoAudienciaFilter] = React.useState<number | ''>('');

  // ---------- Estado de Dialogs ----------
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedAudiencia, setSelectedAudiencia] = React.useState<AudienciaComResponsavel | null>(null);

  // ---------- Dados Auxiliares (usar props se disponíveis, senão buscar) ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposAudiencia: tiposFetched } = useTiposAudiencias({ enabled: !tiposAudienciaData });

  // Usar dados das props se disponíveis, senão usar dados buscados
  const usuarios = usuariosData ?? usuariosFetched;
  const tiposAudiencia = tiposAudienciaData ?? tiposFetched;

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // Map usuarios to audiencias for responsavel name
  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, { nome: string }>();
    usuarios.forEach((u) => {
      map.set(u.id, { nome: getUsuarioNome(u) });
    });
    return map;
  }, [usuarios]);

  // Opções dinâmicas de filtro (derivadas de dados carregados)
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'sem_responsavel', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({ value: String(u.id), label: getUsuarioNome(u) })),
    ],
    [usuarios]
  );

  const tipoAudienciaOptions: readonly FilterOption[] = React.useMemo(
    () => tiposAudiencia.map((t) => ({ value: String(t.id), label: t.descricao })),
    [tiposAudiencia]
  );

  // Enrich audiencias with responsavel name
  const audienciasEnriquecidas = React.useMemo(() => {
    return audiencias.map((a) => ({
      ...a,
      responsavelNome: a.responsavelId ? usuariosMap.get(a.responsavelId)?.nome : null,
    }));
  }, [audiencias, usuariosMap]);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build params
      const params: Record<string, unknown> = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      // Status filter
      if (statusFilter !== 'todas') {
        params.status = statusFilter;
      }

      // Modalidade filter
      if (modalidadeFilter !== 'todas') {
        params.modalidade = modalidadeFilter;
      }

      // Responsável filter
      if (responsavelFilter === 'sem_responsavel') {
        params.responsavelId = 'null';
      } else if (typeof responsavelFilter === 'number') {
        params.responsavelId = responsavelFilter;
      }

      // Date Range (or fixed date)
      if (fixedDate) {
        const dateStr = format(startOfDay(fixedDate), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const dateEndStr = format(endOfDay(fixedDate), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        params.dataInicioInicio = dateStr;
        params.dataInicioFim = dateEndStr;
      } else if (dateRange?.from) {
        params.dataInicioInicio = format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        if (dateRange.to) {
          params.dataInicioFim = format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        }
      }

      // Secondary filters
      if (tribunalFilter) {
        params.trt = tribunalFilter;
      }
      if (grauFilter) {
        params.grau = grauFilter;
      }
      if (tipoAudienciaFilter) {
        params.tipoAudienciaId = tipoAudienciaFilter;
      }

      const result = await actionListarAudiencias(params as Parameters<typeof actionListarAudiencias>[0]);

      if (result.success) {
        setAudiencias(result.data.data as AudienciaComResponsavel[]);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        setError(result.error || 'Erro ao carregar audiências');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    statusFilter,
    modalidadeFilter,
    responsavelFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    tipoAudienciaFilter,
    fixedDate,
  ]);

  // ---------- Efeito para buscar dados ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    refetch();
    // NÃO incluir refetch como dependência para evitar loop de chamadas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    statusFilter,
    modalidadeFilter,
    responsavelFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    tipoAudienciaFilter,
    fixedDate,
  ]);

  // ---------- Handlers ----------
  const handleSucessoOperacao = React.useCallback(() => {
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsNovoDialogOpen(false);
    router.refresh();
  }, [refetch, router]);

  const handleView = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setDetailOpen(true);
  }, []);

  const handleEdit = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setEditOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    router.refresh();
  }, [refetch, router]);

  // Handler para limpar todos os filtros
  const handleClearAllFilters = React.useCallback(() => {
    setStatusFilter('todas');
    setModalidadeFilter('todas');
    setResponsavelFilter('todos');
    setDateRange(undefined);
    setTribunalFilter('');
    setGrauFilter('');
    setTipoAudienciaFilter('');
    setPageIndex(0);
  }, []);

  // Gerar chips de filtros ativos
  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (statusFilter !== 'todas') {
      chips.push({
        key: 'status',
        label: STATUS_AUDIENCIA_LABELS[statusFilter as StatusAudiencia] || statusFilter,
        onRemove: () => setStatusFilter('todas'),
      });
    }

    if (modalidadeFilter !== 'todas') {
      chips.push({
        key: 'modalidade',
        label: MODALIDADE_AUDIENCIA_LABELS[modalidadeFilter as ModalidadeAudiencia] || modalidadeFilter,
        onRemove: () => setModalidadeFilter('todas'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem Responsável',
        onRemove: () => setResponsavelFilter('todos'),
      });
    } else if (typeof responsavelFilter === 'number') {
      const usuario = usuarios.find((u) => u.id === responsavelFilter);
      chips.push({
        key: 'responsavel',
        label: usuario ? getUsuarioNome(usuario) : `Responsável #${responsavelFilter}`,
        onRemove: () => setResponsavelFilter('todos'),
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
        label: GRAU_TRIBUNAL_LABELS[grauFilter] || grauFilter,
        onRemove: () => setGrauFilter(''),
      });
    }

    if (tipoAudienciaFilter) {
      const tipo = tiposAudiencia.find((t) => t.id === tipoAudienciaFilter);
      chips.push({
        key: 'tipo',
        label: tipo?.descricao || `Tipo #${tipoAudienciaFilter}`,
        onRemove: () => setTipoAudienciaFilter(''),
      });
    }

    return chips;
  }, [
    statusFilter,
    modalidadeFilter,
    responsavelFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    tipoAudienciaFilter,
    usuarios,
    tiposAudiencia,
  ]);

  // Columns (memoized)
  const columns = React.useMemo(
    () => getAudienciasColumns(handleView, handleEdit),
    [handleView, handleEdit]
  );

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          table ? (
            <>
              <DataTableToolbar
                table={table}
                title="Audiências"
                density={density}
                onDensityChange={setDensity}
                searchValue={busca}
                onSearchValueChange={(value) => {
                  setBusca(value);
                  setPageIndex(0);
                }}
                searchPlaceholder="Buscar audiências..."
                actionButton={{
                  label: 'Nova Audiência',
                  onClick: () => setIsNovoDialogOpen(true),
                }}
                viewModeSlot={viewModeSlot}
                filtersSlot={
                  <>
                    {/* Status Filter */}
                    <FilterPopover
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={statusFilter}
                      onValueChange={(val) => {
                        setStatusFilter(val as StatusFilterType);
                        setPageIndex(0);
                      }}
                      defaultValue="todas"
                    />

                    {/* Modalidade Filter */}
                    <FilterPopover
                      label="Modalidade"
                      options={MODALIDADE_OPTIONS}
                      value={modalidadeFilter}
                      onValueChange={(val) => {
                        setModalidadeFilter(val as ModalidadeFilterType);
                        setPageIndex(0);
                      }}
                      defaultValue="todas"
                    />

                    {/* Responsável Filter - apenas na view de lista */}
                    {!weekNavigatorProps && (
                      <FilterPopover
                        label="Responsável"
                        options={responsavelOptions}
                        value={
                          responsavelFilter === 'todos'
                            ? 'todos'
                            : responsavelFilter === 'sem_responsavel'
                              ? 'sem_responsavel'
                              : String(responsavelFilter)
                        }
                        onValueChange={(val) => {
                          if (val === 'todos') {
                            setResponsavelFilter('todos');
                          } else if (val === 'sem_responsavel') {
                            setResponsavelFilter('sem_responsavel');
                          } else {
                            setResponsavelFilter(parseInt(val, 10));
                          }
                          setPageIndex(0);
                        }}
                        defaultValue="todos"
                      />
                    )}

                    {/* Date Range Picker - Hide if date is fixed or weekNavigator is present */}
                    {!hideDateFilters && !fixedDate && !weekNavigatorProps && (
                      <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                          setDateRange(range);
                          setPageIndex(0);
                        }}
                        placeholder="Período"
                        className="h-9 w-60 bg-card"
                      />
                    )}

                    {/* Tribunal Filter - apenas na view de lista */}
                    {!weekNavigatorProps && (
                      <FilterPopover
                        label="Tribunal"
                        options={TRIBUNAL_OPTIONS}
                        value={tribunalFilter || 'all'}
                        onValueChange={(val) => {
                          setTribunalFilter(val === 'all' ? '' : val as CodigoTribunal);
                          setPageIndex(0);
                        }}
                      />
                    )}

                    {/* Grau Filter - apenas na view de lista */}
                    {!weekNavigatorProps && (
                      <FilterPopover
                        label="Grau"
                        options={GRAU_OPTIONS}
                        value={grauFilter || 'all'}
                        onValueChange={(val) => {
                          setGrauFilter(val === 'all' ? '' : val as GrauTribunal);
                          setPageIndex(0);
                        }}
                      />
                    )}

                    {/* Tipo Filter */}
                    <FilterPopover
                      label="Tipo"
                      options={tipoAudienciaOptions}
                      value={tipoAudienciaFilter ? String(tipoAudienciaFilter) : 'all'}
                      onValueChange={(val) => {
                        setTipoAudienciaFilter(val === 'all' ? '' : parseInt(val, 10));
                        setPageIndex(0);
                      }}
                    />
                  </>
                }
              />

              {/* Week Navigator - apenas quando weekNavigatorProps existe */}
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
          data={audienciasEnriquecidas}
          columns={columns}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<AudienciaComResponsavel>)}
          emptyMessage="Nenhuma audiência encontrada."
          options={{
            meta: {
              usuarios,
              tiposAudiencia,
              onSuccessAction: handleSucessoOperacao,
            },
          }}
        />
      </DataShell>

      <NovaAudienciaDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedAudiencia && (
        <>
          <AudienciaDetailSheet
            open={detailOpen}
            onOpenChange={setDetailOpen}
            audiencia={selectedAudiencia}
          />

          <DialogFormShell
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Editar Audiência"
            maxWidth="2xl"
            hideFooter
          >
            <AudienciaForm
              initialData={selectedAudiencia}
              onSuccess={handleEditSuccess}
              onClose={() => setEditOpen(false)}
            />
          </DialogFormShell>
        </>
      )}
    </>
  );
}
