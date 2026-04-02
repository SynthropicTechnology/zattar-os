'use client';

/**
 * CLIENTES FEATURE - ClientesTableWrapper
 *
 * Componente Client que encapsula a tabela de clientes.
 * Implementação seguindo o padrão DataShell.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable, SortingState, RowSelectionState } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import type { Cliente } from '../../types';
import { ClienteFormDialog } from './cliente-form';
import { getClientesColumns, ClienteComProcessos } from './columns';
import { actionDesativarCliente, actionListarClientes } from '../../actions';
import { ChatwootSyncButton } from '@/lib/chatwoot/components';
import { FilterPopover, PartesSectionFilter } from '../shared';
import { ClientesBulkActionsBar, DesativarClientesMassaDialog } from './clientes-bulk-actions';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ClientesTableWrapperProps {
  initialData?: Cliente[];
  initialPagination?: PaginationInfo | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClientesTableWrapper({
  initialData = [],
  initialPagination = null,
}: ClientesTableWrapperProps = {}) {
  const router = useRouter();
  const [clientes, setClientes] = React.useState<ClienteComProcessos[]>(initialData as ClienteComProcessos[]);
  const [table, setTable] = React.useState<TanstackTable<ClienteComProcessos> | null>(null);

  // Pagination
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filters
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [situacao, setSituacao] = React.useState<'ativo' | 'inativo' | ''>('ativo');

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [clienteParaEditar, setClienteParaEditar] = React.useState<ClienteComProcessos | null>(null);
  const [desativarMassaOpen, setDesativarMassaOpen] = React.useState(false);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Bulk selection helpers
  const selectedIds = React.useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map(Number),
    [rowSelection]
  );
  const selectedCount = selectedIds.length;

  // Data fetching
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarClientes({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        tipo_pessoa: tipoPessoa === 'all' ? undefined : tipoPessoa,
        ativo: situacao === '' ? undefined : situacao === 'ativo',
        incluir_endereco: true,
        incluir_processos: true,
      });
      if (result.success) {
        const data = result.data as { data: ClienteComProcessos[]; pagination: PaginationInfo };
        setClientes(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, tipoPessoa, situacao]);

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialPagination) return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, refetch, initialPagination]);

  const handleEdit = React.useCallback((cliente: ClienteComProcessos) => {
    setClienteParaEditar(cliente);
    setEditOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (cliente: ClienteComProcessos) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await actionDesativarCliente(cliente.id);
        if (!result.success) {
          setError(result.error);
          return;
        }
        await refetch();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao desativar cliente');
      } finally {
        setIsLoading(false);
      }
    },
    [refetch, router]
  );

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setClienteParaEditar(null);
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  const handleBulkSuccess = React.useCallback(() => {
    setRowSelection({});
    refetch();
    router.refresh();
  }, [refetch, router]);

  const columns = React.useMemo(
    () => getClientesColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete]
  );

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Clientes"
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar clientes..."
              actionButton={{
                label: 'Novo Cliente',
                onClick: () => setCreateOpen(true),
              }}
              actionSlot={
                <>
                  {selectedCount > 0 && (
                    <ClientesBulkActionsBar
                      selectedCount={selectedCount}
                      onClearSelection={() => setRowSelection({})}
                      onDesativar={() => setDesativarMassaOpen(true)}
                    />
                  )}
                  <ChatwootSyncButton
                    tipoEntidade="cliente"
                    apenasAtivos={situacao === 'ativo'}
                  />
                </>
              }
              filtersSlot={
                <>
                  <PartesSectionFilter currentSection="clientes" />
                  <FilterPopover
                    label="Situação"
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'inativo', label: 'Inativo' },
                    ]}
                    value={situacao}
                    onValueChange={(val) => {
                      setSituacao(val as typeof situacao);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Tipo Pessoa"
                    options={[
                      { value: 'pf', label: 'Pessoa Física' },
                      { value: 'pj', label: 'Pessoa Jurídica' },
                    ]}
                    value={tipoPessoa}
                    onValueChange={(val) => {
                      setTipoPessoa(val as typeof tipoPessoa);
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
          data={clientes}
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
          onSortingChange={setSorting}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => String(row.id),
          }}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum cliente encontrado."
          onTableReady={(t) => setTable(t as TanstackTable<ClienteComProcessos>)}
        />
      </DataShell>

      {/* Dialogs */}
      <ClienteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      {clienteParaEditar && (
        <ClienteFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setClienteParaEditar(null);
          }}
          cliente={clienteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}

      {/* Bulk action dialog */}
      <DesativarClientesMassaDialog
        open={desativarMassaOpen}
        onOpenChange={setDesativarMassaOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
