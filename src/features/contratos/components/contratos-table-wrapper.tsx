'use client';

/**
 * CONTRATOS FEATURE - ContratosTableWrapper
 *
 * Componente Client que encapsula a tabela de contratos.
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação client-side com refresh via Server Actions
 * - Sheets de criação, edição e visualização
 *
 * Implementação seguindo o padrão DataShell.
 * Referência: src/features/partes/components/clientes/clientes-table-wrapper.tsx
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { FilterPopover, type FilterOption } from '@/features/partes/components/shared';
import type { Table as TanstackTable, SortingState, RowSelectionState } from '@tanstack/react-table';

import { getContratosColumns } from './columns';
import type { ContratosTableMeta } from './columns';
import { ContratoForm } from './contrato-form';
import { SegmentosFilter } from './segmentos-filter';
import { ContratoDeleteDialog } from './contrato-delete-dialog';
import {
  ContratosBulkActionsBar,
  AlterarStatusMassaDialog,
  AtribuirResponsavelMassaDialog,
  AlterarSegmentoMassaDialog,
  ExcluirMassaDialog,
} from './contratos-bulk-actions';
import { GerarPecaDialog } from '@/features/pecas-juridicas/components';
import type {
  Contrato,
  ListarContratosParams,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  ContratoSortBy,
  Ordem,
} from '../domain';
import type { PaginationInfo, ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import {
  actionListarContratos,
  actionResolverNomesEntidadesContrato,
} from '../actions';

// =============================================================================
// OPÇÕES DE FILTRO
// =============================================================================

const TIPO_CONTRATO_OPTIONS: readonly FilterOption[] = Object.entries(TIPO_CONTRATO_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TIPO_COBRANCA_OPTIONS: readonly FilterOption[] = Object.entries(TIPO_COBRANCA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const STATUS_CONTRATO_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_CONTRATO_LABELS).map(
  ([value, label]) => ({ value, label })
);

// =============================================================================
// TIPOS
// =============================================================================

interface ContratosTableWrapperProps {
  initialData: Contrato[];
  initialPagination: PaginationInfo | null;
  clientesOptions: ClienteInfo[];
  partesContrariasOptions: ClienteInfo[];
  usuariosOptions?: ClienteInfo[];
  segmentosOptions?: Array<{ id: number; nome: string }>;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratosTableWrapper({
  initialData,
  initialPagination,
  clientesOptions,
  partesContrariasOptions,
  usuariosOptions = [],
  segmentosOptions = [],
}: ContratosTableWrapperProps) {
  // ---------- Estado dos Dados ----------
  const [contratos, setContratos] = React.useState<Contrato[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<Contrato> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Opções dinâmicas (para evitar fallback "Cliente #ID" quando mudar de página/refetch)
  const [clientesOptionsState, setClientesOptionsState] = React.useState<ClienteInfo[]>(clientesOptions);
  const [partesContrariasOptionsState, setPartesContrariasOptionsState] =
    React.useState<ClienteInfo[]>(partesContrariasOptions);
  const [usuariosOptionsState, setUsuariosOptionsState] = React.useState<ClienteInfo[]>(usuariosOptions);

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 50
  );
  const [total, setTotal] = React.useState(
    initialPagination ? initialPagination.total : 0
  );
  const [totalPages, setTotalPages] = React.useState(
    initialPagination ? initialPagination.totalPages : 0
  );

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado de Filtros ----------
  const [busca, setBusca] = React.useState('');
  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [tipoContrato, setTipoContrato] = React.useState<string>('');
  const [tipoCobranca, setTipoCobranca] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [segmentos, _setSegmentos] = React.useState(segmentosOptions);

  // ---------- Estado de Seleção (Ações em Massa) ----------
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // ---------- Estado de Dialogs/Sheets ----------
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [gerarPecaOpen, setGerarPecaOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [contratoSelecionado, setContratoSelecionado] = React.useState<Contrato | null>(null);

  // Dialogs de ações em massa
  const [bulkStatusOpen, setBulkStatusOpen] = React.useState(false);
  const [bulkResponsavelOpen, setBulkResponsavelOpen] = React.useState(false);
  const [bulkSegmentoOpen, setBulkSegmentoOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Maps para lookup O(1) ----------
  const clientesMap = React.useMemo(() => {
    return new Map(clientesOptionsState.map((c) => [c.id, c]));
  }, [clientesOptionsState]);

  const partesContrariasMap = React.useMemo(() => {
    return new Map(partesContrariasOptionsState.map((p) => [p.id, p]));
  }, [partesContrariasOptionsState]);

  const usuariosMap = React.useMemo(() => {
    return new Map(usuariosOptionsState.map((u) => [u.id, u]));
  }, [usuariosOptionsState]);

  const segmentosMap = React.useMemo(() => {
    return new Map(segmentos.map((s) => [s.id, { nome: s.nome }]));
  }, [segmentos]);

  // Refs para acessar os valores atuais das options sem incluí-los como deps do useEffect
  // (evita loop: efeito atualiza options → options mudam → efeito re-executa)
  const clientesOptionsRef = React.useRef(clientesOptionsState);
  clientesOptionsRef.current = clientesOptionsState;
  const partesContrariasOptionsRef = React.useRef(partesContrariasOptionsState);
  partesContrariasOptionsRef.current = partesContrariasOptionsState;
  const usuariosOptionsRef = React.useRef(usuariosOptionsState);
  usuariosOptionsRef.current = usuariosOptionsState;

  // Completar nomes faltantes quando contratos mudam via refetch (paginação/filtros).
  // Pula o render inicial: as entities já foram pré-carregadas pelo Server Component.
  // Usa comparação de referência para ser StrictMode-safe (ref preserva mesma referência).
  const prevContratosRef = React.useRef(contratos);

  React.useEffect(() => {
    // No mount e StrictMode remount, contratos === prevContratosRef.current (mesma referência)
    if (prevContratosRef.current === contratos) return;
    prevContratosRef.current = contratos;

    let cancelled = false;

    const run = async () => {
      const currentClientes = new Set(clientesOptionsRef.current.map((c) => c.id));
      const currentPartes = new Set(partesContrariasOptionsRef.current.map((p) => p.id));
      const currentUsuarios = new Set(usuariosOptionsRef.current.map((u) => u.id));

      const missingClienteIds = Array.from(
        new Set(contratos.map((c) => c.clienteId).filter((id) => !currentClientes.has(id)))
      );

      const missingParteContrariaIds = Array.from(
        new Set(
          contratos
            .flatMap((c) => c.partes ?? [])
            .filter((p) => p.tipoEntidade === 'parte_contraria')
            .map((p) => p.entidadeId)
            .filter((id) => !currentPartes.has(id))
        )
      );

      const missingUsuarioIds = Array.from(
        new Set(
          contratos
            .map((c) => c.responsavelId)
            .filter((id): id is number => typeof id === 'number' && id > 0)
            .filter((id) => !currentUsuarios.has(id))
        )
      );

      if (!missingClienteIds.length && !missingParteContrariaIds.length && !missingUsuarioIds.length) return;

      const result = await actionResolverNomesEntidadesContrato({
        clienteIds: missingClienteIds,
        partesContrariasIds: missingParteContrariaIds,
        usuariosIds: missingUsuarioIds,
      });

      if (cancelled || !result.success) return;

      const appendUnique = (prev: ClienteInfo[], incoming: ClienteInfo[]) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        for (const item of incoming) map.set(item.id, item);
        return Array.from(map.values());
      };

      if (result.data.clientes?.length) {
        setClientesOptionsState((prev) => appendUnique(prev, result.data.clientes));
      }
      if (result.data.partesContrarias?.length) {
        setPartesContrariasOptionsState((prev) => appendUnique(prev, result.data.partesContrarias));
      }
      if (result.data.usuarios?.length) {
        setUsuariosOptionsState((prev) => appendUnique(prev, result.data.usuarios));
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [contratos]);

  // ---------- Helpers ----------
  const getSortParams = React.useCallback((sortingState: SortingState): { ordenarPor?: ContratoSortBy; ordem?: Ordem } => {
    if (sortingState.length === 0) return {};

    const { id, desc } = sortingState[0];
    const ordem = desc ? 'desc' : 'asc';

    switch (id) {
      case 'cadastradoEm':
        return { ordenarPor: 'cadastrado_em', ordem };
      case 'createdAt':
        return { ordenarPor: 'created_at', ordem };
      case 'updatedAt':
        return { ordenarPor: 'updated_at', ordem };
      case 'id':
        return { ordenarPor: 'id', ordem };
      default:
        return {};
    }
  }, []);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarContratosParams = {
        pagina: pageIndex + 1,  // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
        segmentoId: segmentoId ? Number(segmentoId) : undefined,
        tipoContrato: (tipoContrato || undefined) as TipoContrato | undefined,
        tipoCobranca: (tipoCobranca || undefined) as TipoCobranca | undefined,
        status: (status || undefined) as StatusContrato | undefined,
        ...getSortParams(sorting),
      };

      const result = await actionListarContratos(params);

      if (result.success) {
        const data = result.data as { data: Contrato[]; pagination: PaginationInfo };
        setContratos(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, segmentoId, tipoContrato, tipoCobranca, status, sorting, getSortParams]);

  // ---------- Refetch reativo a filtros ----------
  // Usa snapshot dos valores anteriores para:
  // 1. Pular o render inicial (dados já vieram do server)
  // 2. Funcionar corretamente com React StrictMode (refs persistem entre mount/unmount)
  const prevFiltersRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const filterKey = JSON.stringify([pageIndex, pageSize, buscaDebounced, segmentoId, tipoContrato, tipoCobranca, status, sorting]);

    if (prevFiltersRef.current === filterKey) return;

    const isInitial = prevFiltersRef.current === null;
    prevFiltersRef.current = filterKey;

    if (isInitial) return; // dados já carregados pelo Server Component

    refetch();
  }, [pageIndex, pageSize, buscaDebounced, segmentoId, tipoContrato, tipoCobranca, status, sorting, refetch]);

  // ---------- Handlers ----------
  const handleEdit = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditOpen(true);
  }, []);

  const handleGerarPeca = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setGerarPecaOpen(true);
  }, []);

  const handleDelete = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setDeleteOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setContratoSelecionado(null);
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  // ---------- Seleção em Massa ----------
  const selectedIds = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [rowSelection]);

  const selectedCount = selectedIds.length;

  const handleBulkSuccess = React.useCallback(() => {
    setRowSelection({});
    refetch();
  }, [refetch]);

  const getRowId = React.useCallback((row: Contrato) => String(row.id), []);

  // ---------- Columns (Memoized) ----------
  const columns = React.useMemo(
    () => getContratosColumns(clientesMap, partesContrariasMap, usuariosMap, segmentosMap, handleEdit, handleGerarPeca, handleDelete),
    [clientesMap, partesContrariasMap, usuariosMap, segmentosMap, handleEdit, handleGerarPeca, handleDelete]
  );

  // ---------- Ocultar coluna ID por padrão ----------
  React.useEffect(() => {
    if (table) {
      table.setColumnVisibility((prev) => ({
        ...prev,
        id: false,
        createdAt: false,
        updatedAt: false,
        observacoes: false,
      }));
    }
  }, [table]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Contratos"
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar contratos..."
              actionButton={{
                label: 'Novo Contrato',
                onClick: () => setCreateOpen(true),
              }}
              filtersSlot={
                <>
                  <SegmentosFilter
                    value={segmentoId}
                    onValueChange={(val) => {
                      setSegmentoId(val);
                      setPageIndex(0);
                    }}
                  />

                  <FilterPopover
                    label="Tipo Contrato"
                    options={TIPO_CONTRATO_OPTIONS}
                    value={tipoContrato || 'all'}
                    onValueChange={(val) => {
                      setTipoContrato(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  />

                  <FilterPopover
                    label="Cobrança"
                    options={TIPO_COBRANCA_OPTIONS}
                    value={tipoCobranca || 'all'}
                    onValueChange={(val) => {
                      setTipoCobranca(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  />

                  <FilterPopover
                    label="Status"
                    options={STATUS_CONTRATO_OPTIONS}
                    value={status || 'all'}
                    onValueChange={(val) => {
                      setStatus(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        {selectedCount > 0 && (
          <div className="px-3 py-2">
            <ContratosBulkActionsBar
              selectedCount={selectedCount}
              onClearSelection={() => setRowSelection({})}
              onAlterarStatus={() => setBulkStatusOpen(true)}
              onAtribuirResponsavel={() => setBulkResponsavelOpen(true)}
              onAlterarSegmento={() => setBulkSegmentoOpen(true)}
              onExcluir={() => setBulkDeleteOpen(true)}
            />
          </div>
        )}
        <DataTable
          data={contratos}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          sorting={sorting}
          onSortingChange={(next) => {
            setSorting(next);
            // Ao mudar ordenação, voltar para a primeira página (server-side sorting)
            setPageIndex(0);
          }}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId,
          }}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Contrato>)}
          emptyMessage="Nenhum contrato encontrado."
          options={{
            meta: {
              usuarios: usuariosOptionsState,
              onSuccessAction: refetch,
            } satisfies ContratosTableMeta,
          }}
        />
      </DataShell>

      {/* Sheet de criação */}
      <ContratoForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        clientesOptions={clientesOptions}
        partesContrariasOptions={partesContrariasOptions}
        usuariosOptions={usuariosOptions}
        onSuccess={handleCreateSuccess}
      />

      {/* Sheet de edição */}
      {contratoSelecionado && (
        <ContratoForm
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          mode="edit"
          contrato={contratoSelecionado}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Dialog de geração de peça */}
      {contratoSelecionado && gerarPecaOpen && (
        <GerarPecaDialog
          contratoId={contratoSelecionado.id}
          open={gerarPecaOpen}
          onOpenChange={(open) => {
            setGerarPecaOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Dialog de exclusão */}
      {contratoSelecionado && deleteOpen && (
        <ContratoDeleteDialog
          contratoId={contratoSelecionado.id}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Dialogs de ações em massa */}
      <AlterarStatusMassaDialog
        open={bulkStatusOpen}
        onOpenChange={setBulkStatusOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
      <AtribuirResponsavelMassaDialog
        open={bulkResponsavelOpen}
        onOpenChange={setBulkResponsavelOpen}
        selectedIds={selectedIds}
        usuarios={usuariosOptionsState}
        onSuccess={handleBulkSuccess}
      />
      <AlterarSegmentoMassaDialog
        open={bulkSegmentoOpen}
        onOpenChange={setBulkSegmentoOpen}
        selectedIds={selectedIds}
        segmentos={segmentosOptions}
        onSuccess={handleBulkSuccess}
      />
      <ExcluirMassaDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
