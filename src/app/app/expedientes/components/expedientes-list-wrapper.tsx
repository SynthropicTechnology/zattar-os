'use client';

/**
 * ExpedientesListWrapper - Wrapper auto-contido para a view de lista
 *
 * Segue o padrão de AudienciasListWrapper:
 * - Gerencia próprio estado de filtros, paginação e fetch
 * - DataShell + DataTableToolbar + DataTable + DataPagination
 * - ExpedientesListFilters no filtersSlot
 * - ExpedientesBulkActions para seleção em lote
 * - Dialog de criação interno
 */

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format, startOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { X } from 'lucide-react';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';

import type { Expediente } from '../domain';
import { GrauTribunal, GRAU_TRIBUNAL_LABELS, OrigemExpediente, ORIGEM_EXPEDIENTE_LABELS } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/app/usuarios';
import { useTiposExpedientes } from '@/app/app/tipos-expedientes';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedientesBulkActions } from './expedientes-bulk-actions';
import {
  ExpedientesListFilters,
  type StatusFilterType,
  type PrazoFilterType,
  type ResponsavelFilterType,
} from './expedientes-list-filters';

// =============================================================================
// TIPOS
// =============================================================================

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

interface ExpedientesListWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioData[];
  /** Dados de tipos de expediente pré-carregados (evita fetch duplicado) */
  tiposExpedientesData?: TipoExpedienteData[];
}

// Helper para obter nome do usuário
function getUsuarioNome(u: UsuarioData): string {
  return u.nomeExibicao || u.nome_exibicao || u.nomeCompleto || u.nome || `Usuário ${u.id}`;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesListWrapper({
  viewModeSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesListWrapperProps) {
  const searchParams = useSearchParams();

  // ---------- Estado da Tabela ----------
  const [table, setTable] = React.useState<TanstackTable<Expediente> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // ---------- Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // ---------- Busca e Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('pendentes');
  const [prazoFilter, setPrazoFilter] = React.useState<PrazoFilterType>('todos');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState('');
  const [origemFilter, setOrigemFilter] = React.useState('');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Track se já inicializou com query param ----------
  const hasInitializedFromParams = React.useRef(false);

  React.useEffect(() => {
    if (hasInitializedFromParams.current) return;
    hasInitializedFromParams.current = true;

    const responsavelParam = searchParams.get('responsavel');
    if (!responsavelParam) return;

    if (responsavelParam === 'sem_responsavel') {
      setResponsavelFilter('sem_responsavel');
    } else {
      const parsed = parseInt(responsavelParam, 10);
      if (!Number.isNaN(parsed)) {
        setResponsavelFilter(parsed);
      }
    }
  }, [searchParams]);

  // ---------- Dialogs ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  // ---------- Calcular datas para filtro de prazo ----------
  const getPrazoDates = React.useCallback((prazo: PrazoFilterType): { from?: string; to?: string } | null => {
    const hoje = new Date();
    switch (prazo) {
      case 'vencidos':
      case 'sem_prazo':
        return null;
      case 'hoje': {
        const hojeStr = format(startOfDay(hoje), 'yyyy-MM-dd');
        return { from: hojeStr, to: hojeStr };
      }
      case 'amanha': {
        const amanhaStr = format(startOfDay(addDays(hoje, 1)), 'yyyy-MM-dd');
        return { from: amanhaStr, to: amanhaStr };
      }
      case 'semana': {
        return {
          from: format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          to: format(endOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      }
      default:
        return null;
    }
  }, []);

  // ---------- Montar params para o hook ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: globalFilter || undefined,
    };

    // Status
    if (statusFilter === 'pendentes') params.baixado = false;
    if (statusFilter === 'baixados') params.baixado = true;

    // Prazo
    if (prazoFilter === 'vencidos') {
      params.prazoVencido = true;
    } else if (prazoFilter === 'sem_prazo') {
      params.semPrazo = true;
    } else if (prazoFilter !== 'todos') {
      const prazoDates = getPrazoDates(prazoFilter);
      if (prazoDates) {
        params.dataPrazoLegalInicio = prazoDates.from;
        params.dataPrazoLegalFim = prazoDates.to;
      }
    }

    // DateRange (sobrescreve prazoFilter se definido)
    if (dateRange?.from) params.dataPrazoLegalInicio = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to) params.dataPrazoLegalFim = format(dateRange.to, 'yyyy-MM-dd');

    // Responsável
    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    // Filtros avançados
    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (tipoExpedienteFilter) params.tipoExpedienteId = parseInt(tipoExpedienteFilter, 10);
    if (origemFilter) params.origem = origemFilter;

    return params;
  }, [
    pageIndex, pageSize, globalFilter,
    statusFilter, prazoFilter, responsavelFilter,
    tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter,
    dateRange, getPrazoDates,
  ]);

  // ---------- Data Fetching ----------
  const { expedientes, paginacao, isLoading, error, refetch } = useExpedientes(hookParams);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  // ---------- Handlers ----------
  const handleSucessoOperacao = React.useCallback(() => {
    setRowSelection((currentSelection) => {
      if (Object.keys(currentSelection).length === 0) {
        return currentSelection;
      }

      return {};
    });
    refetch();
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  // Handler para limpar todos os filtros
  const handleClearAllFilters = React.useCallback(() => {
    setStatusFilter('pendentes');
    setPrazoFilter('todos');
    setResponsavelFilter('todos');
    setDateRange(undefined);
    setTribunalFilter('');
    setGrauFilter('');
    setTipoExpedienteFilter('');
    setOrigemFilter('');
    setPageIndex(0);
  }, []);

  // ---------- Chips de filtros ativos ----------
  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (statusFilter !== 'pendentes') {
      chips.push({
        key: 'status',
        label: statusFilter === 'todos' ? 'Todos Status' : 'Baixados',
        onRemove: () => setStatusFilter('pendentes'),
      });
    }

    if (prazoFilter !== 'todos') {
      const prazoLabels: Record<PrazoFilterType, string> = {
        todos: 'Todos',
        vencidos: 'Vencidos',
        hoje: 'Hoje',
        amanha: 'Amanhã',
        semana: 'Esta Semana',
        sem_prazo: 'Sem Prazo',
      };
      chips.push({
        key: 'prazo',
        label: prazoLabels[prazoFilter],
        onRemove: () => setPrazoFilter('todos'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem Responsável',
        onRemove: () => setResponsavelFilter('todos'),
      });
    } else if (typeof responsavelFilter === 'number') {
      const usuario = usuarios.find((u: UsuarioData) => u.id === responsavelFilter);
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
        label: GRAU_TRIBUNAL_LABELS[grauFilter as GrauTribunal] || grauFilter,
        onRemove: () => setGrauFilter(''),
      });
    }

    if (tipoExpedienteFilter) {
      const tipo = tiposExpedientes.find((t: TipoExpedienteData) => t.id === parseInt(tipoExpedienteFilter, 10));
      const tipoLabel = tipo ? (tipo.tipoExpediente || ('tipo_expediente' in tipo ? (tipo as TipoExpedienteData).tipo_expediente : undefined) || `Tipo #${tipo.id}`) : `Tipo #${tipoExpedienteFilter}`;
      chips.push({
        key: 'tipo',
        label: tipoLabel,
        onRemove: () => setTipoExpedienteFilter(''),
      });
    }

    if (origemFilter) {
      chips.push({
        key: 'origem',
        label: ORIGEM_EXPEDIENTE_LABELS[origemFilter as OrigemExpediente] || origemFilter,
        onRemove: () => setOrigemFilter(''),
      });
    }

    return chips;
  }, [statusFilter, prazoFilter, responsavelFilter, dateRange, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter, usuarios, tiposExpedientes]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          table ? (
            <>
              <DataTableToolbar
                table={table}
                title="Expedientes"
                density={density}
                onDensityChange={setDensity}
                searchValue={globalFilter}
                onSearchValueChange={(value: string) => {
                  setGlobalFilter(value);
                  setPageIndex(0);
                }}
                searchPlaceholder="Buscar expedientes..."
                actionButton={{
                  label: 'Novo Expediente',
                  onClick: () => setIsCreateDialogOpen(true),
                }}
                viewModeSlot={viewModeSlot}
                filtersSlot={
                  <>
                    <ExpedientesListFilters
                      statusFilter={statusFilter}
                      onStatusChange={(v) => { setStatusFilter(v); setPageIndex(0); }}
                      prazoFilter={prazoFilter}
                      onPrazoChange={(v) => {
                        setPrazoFilter(v);
                        setDateRange(undefined);
                        setPageIndex(0);
                      }}
                      responsavelFilter={responsavelFilter}
                      onResponsavelChange={(v) => { setResponsavelFilter(v); setPageIndex(0); }}
                      tribunalFilter={tribunalFilter}
                      onTribunalChange={(v) => { setTribunalFilter(v); setPageIndex(0); }}
                      grauFilter={grauFilter}
                      onGrauChange={(v) => { setGrauFilter(v); setPageIndex(0); }}
                      tipoExpedienteFilter={tipoExpedienteFilter}
                      onTipoExpedienteChange={(v) => { setTipoExpedienteFilter(v); setPageIndex(0); }}
                      origemFilter={origemFilter}
                      onOrigemChange={(v) => { setOrigemFilter(v); setPageIndex(0); }}
                      usuarios={usuarios}
                      tiposExpedientes={tiposExpedientes}
                    />

                    <DateRangePicker
                      value={dateRange}
                      onChange={(range) => {
                        setDateRange(range);
                        if (range?.from || range?.to) {
                          setPrazoFilter('todos');
                        }
                        setPageIndex(0);
                      }}
                      placeholder="Período"
                      className="h-9 w-60 bg-card"
                    />
                  </>
                }
              />

              {/* Bulk Actions — entre toolbar e filtros ativos */}
              {Object.keys(rowSelection).length > 0 && (
                <ExpedientesBulkActions
                  selectedRows={expedientes.filter((exp) => rowSelection[exp.id.toString()])}
                  usuarios={usuarios.map((u: UsuarioData) => ({ id: u.id, nomeExibicao: getUsuarioNome(u) }))}
                  onSuccess={() => {
                    setRowSelection({});
                    handleSucessoOperacao();
                  }}
                />
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
          data={expedientes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Expediente>)}
          emptyMessage="Nenhum expediente encontrado."
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          options={{
            meta: {
              usuarios,
              tiposExpedientes,
              onSuccessAction: handleSucessoOperacao,
            },
          }}
        />
      </DataShell>

      <ExpedienteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
