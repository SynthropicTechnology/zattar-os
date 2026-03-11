'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataPagination } from '@/components/shared/data-shell/data-pagination';
import { PageShell } from '@/components/shared/page-shell';
import { useDebounce } from '@/hooks/use-debounce';
import { buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  useAdvogados,
  actionCriarAdvogado,
  actionAtualizarAdvogado,
  type Advogado,
  type CriarAdvogadoParams,
  type AtualizarAdvogadoParams,
} from '@/features/advogados';
import { UFS_BRASIL } from '@/features/advogados/domain';
import { criarColunasAdvogados } from '../components/advogados/advogados-columns';
import { AdvogadoDialog } from '../components/advogados/advogado-dialog';
import { AdvogadosFilter } from '../components/advogados/advogados-filter';
import { CredenciaisAdvogadoDialog } from '../components/advogados/credenciais-advogado-dialog';

export default function AdvogadosPage() {
  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [ufFilter, setUfFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Reset pageIndex quando filtros mudam
  React.useEffect(() => {
    setPageIndex(0);
  }, [buscaDebounced, ufFilter]);

  // Buscar advogados
  const { advogados, paginacao, isLoading, error, refetch } = useAdvogados({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: buscaDebounced || undefined,
    uf_oab: ufFilter !== 'all' ? ufFilter : undefined,
  });

  // Table state for DataTableToolbar
  const [table, setTable] = useState<TanstackTable<Advogado> | null>(null);
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de dialogs
  const [advogadoDialog, setAdvogadoDialog] = useState<{
    open: boolean;
    advogado: Advogado | null;
    mode: 'create' | 'edit';
  }>({
    open: false,
    advogado: null,
    mode: 'create',
  });

  const [credenciaisDialog, setCredenciaisDialog] = useState<{
    open: boolean;
    advogado: Advogado | null;
  }>({
    open: false,
    advogado: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    advogado: Advogado | null;
  }>({
    open: false,
    advogado: null,
  });

  // Handlers
  const handleEdit = useCallback((advogado: Advogado) => {
    setAdvogadoDialog({ open: true, advogado, mode: 'edit' });
  }, []);

  const handleDelete = useCallback((advogado: Advogado) => {
    setDeleteDialog({ open: true, advogado });
  }, []);

  const handleViewCredenciais = useCallback((advogado: Advogado) => {
    setCredenciaisDialog({ open: true, advogado });
  }, []);

  const handleSaveAdvogado = useCallback(
    async (data: CriarAdvogadoParams | AtualizarAdvogadoParams) => {
      if (advogadoDialog.advogado && advogadoDialog.mode === 'edit') {
        const result = await actionAtualizarAdvogado(advogadoDialog.advogado.id, data);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar advogado');
        }
        toast.success('Advogado atualizado com sucesso!');
      } else {
        const result = await actionCriarAdvogado(data as CriarAdvogadoParams);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar advogado');
        }
        toast.success('Advogado cadastrado com sucesso!');
      }
      setAdvogadoDialog({ open: false, advogado: null, mode: 'create' });
      refetch();
    },
    [advogadoDialog.advogado, advogadoDialog.mode, refetch]
  );

  const confirmarDelete = async () => {
    if (!deleteDialog.advogado) return;

    try {
      // TODO: Implementar actionDeletarAdvogado quando disponível
      toast.error('Funcionalidade de exclusão ainda não implementada');
      setDeleteDialog({ open: false, advogado: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir advogado');
    }
  };

  // Colunas
  const colunas = useMemo(
    () =>
      criarColunasAdvogados({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onViewCredenciais: handleViewCredenciais,
      }),
    [handleEdit, handleDelete, handleViewCredenciais]
  );

  // Opções para o filtro de UF
  const ufOptions = useMemo(() => {
    return UFS_BRASIL.map(uf => ({
      label: uf,
      value: uf
    }));
  }, []);

  return (
    <PageShell>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Advogados"
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={setBusca}
              searchPlaceholder="Buscar advogados..."
              actionButton={{
                label: 'Novo Advogado',
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setAdvogadoDialog({ open: true, advogado: null, mode: 'create' }),
              }}
              filtersSlot={
                <AdvogadosFilter
                  title="UF"
                  options={ufOptions}
                  value={ufFilter}
                  onValueChange={setUfFilter}
                />
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          paginacao ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
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
          data={advogados}
          columns={colunas}
          isLoading={isLoading}
          error={error}
          density={density}
          emptyMessage="Nenhum advogado encontrado."
          hidePagination={true}
          onTableReady={(t) => setTable(t as TanstackTable<Advogado>)}
        />
      </DataShell>

      {/* Dialog de criar/editar advogado (multi-OAB) */}
      <AdvogadoDialog
        open={advogadoDialog.open}
        onOpenChangeAction={(open) => setAdvogadoDialog({ ...advogadoDialog, open })}
        advogado={advogadoDialog.advogado}
        mode={advogadoDialog.mode}
        onSaveAction={handleSaveAdvogado}
      />

      {/* Dialog de credenciais do advogado (com cadastro em massa) */}
      <CredenciaisAdvogadoDialog
        open={credenciaisDialog.open}
        onOpenChangeAction={(open) => setCredenciaisDialog({ ...credenciaisDialog, open })}
        advogado={credenciaisDialog.advogado}
        onRefreshAction={() => refetch()}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir advogado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o advogado{' '}
              <strong>{deleteDialog.advogado?.nome_completo}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
