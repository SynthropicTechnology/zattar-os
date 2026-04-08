'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Table as TanstackTable, RowSelectionState } from '@tanstack/react-table';
import { Plus, PowerOff, Power } from 'lucide-react';
import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { useDebounce } from '@/hooks/use-debounce';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  actionAtualizarCredencial,
  actionAtualizarStatusCredenciaisEmLote,
  useAdvogados,
  type Advogado,
} from '@/app/(authenticated)/advogados';
import { AdvogadoCombobox } from '@/app/(authenticated)/captura';
import { criarColunasCredenciais } from '../components/credenciais/credenciais-columns';
import { AdvogadoViewDialog } from '../components/credenciais/advogado-view-dialog';
import { CredenciaisAdvogadoDialog } from '../components/advogados/credenciais-advogado-dialog';
import { AdvogadosFilter } from '../components/advogados/advogados-filter';
import { toast } from 'sonner';
import { GRAU_LABELS } from '@/lib/design-system';
import type { Credencial } from '@/app/(authenticated)/captura/types';

export default function CredenciaisPage() {
  const searchParams = useSearchParams();
  const advogadoIdFromUrl = searchParams.get('advogado');

  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state for DataTableToolbar
  const [table, setTable] = useState<TanstackTable<Credencial> | null>(null);
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  const buscarCredenciais = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (advogadoIdFromUrl) {
        params.set('advogado_id', advogadoIdFromUrl);
      }
      const url = `/api/captura/credenciais${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error('Erro ao buscar credenciais');
      }
      setCredenciais(data.data.credenciais);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      setError(errorMessage);
      setCredenciais([]);
    } finally {
      setIsLoading(false);
    }
  }, [advogadoIdFromUrl]);

  useEffect(() => {
    buscarCredenciais();
  }, [buscarCredenciais]);

  const toggleStatus = useCallback(
    async (advogadoId: number, credencialId: number, active: boolean) => {
      const result = await actionAtualizarCredencial(credencialId, { active });
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar credencial');
      }
      await buscarCredenciais();
    },
    [buscarCredenciais]
  );

  const refetch = buscarCredenciais;

  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [grauFilter, setGrauFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Buscar advogados para o seletor de "Nova Credencial"
  const { advogados: advogadosList, isLoading: advogadosLoading } = useAdvogados({ limite: 100 });

  // Estados de dialogs
  const [advogadoDialog, setAdvogadoDialog] = useState<{
    open: boolean;
    credencial: Credencial | null;
  }>({
    open: false,
    credencial: null,
  });

  // Dialog para selecionar advogado antes de criar credenciais
  const [selecionarAdvogadoDialog, setSelecionarAdvogadoDialog] = useState(false);
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<number | null>(null);

  // Dialog de credenciais (batch) para o advogado selecionado
  const [credenciaisAdvogadoDialog, setCredenciaisAdvogadoDialog] = useState<{
    open: boolean;
    advogado: Advogado | null;
  }>({
    open: false,
    advogado: null,
  });

  // Row selection para bulk actions
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkToggleDialog, setBulkToggleDialog] = useState<{
    open: boolean;
    action: 'ativar' | 'desativar';
  }>({ open: false, action: 'desativar' });
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    credencial: Credencial | null;
  }>({
    open: false,
    credencial: null,
  });

  // Handlers
  const handleViewAdvogado = useCallback((credencial: Credencial) => {
    setAdvogadoDialog({ open: true, credencial });
  }, []);

  const handleEdit = useCallback((credencial: Credencial) => {
    // Encontrar o advogado e abrir o dialog de credenciais dele
    const advogado = advogadosList.find((a) => a.id === credencial.advogado_id);
    if (advogado) {
      setCredenciaisAdvogadoDialog({ open: true, advogado });
    } else {
      toast.error('Advogado não encontrado');
    }
  }, [advogadosList]);

  const handleToggleStatus = useCallback((credencial: Credencial) => {
    setToggleDialog({ open: true, credencial });
  }, []);

  const confirmarToggleStatus = async () => {
    if (!toggleDialog.credencial) return;

    try {
      await toggleStatus(
        toggleDialog.credencial.advogado_id,
        toggleDialog.credencial.id,
        !toggleDialog.credencial.active
      );

      toast.success(
        `Credencial ${toggleDialog.credencial.active ? 'desativada' : 'ativada'} com sucesso!`
      );

      setToggleDialog({ open: false, credencial: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  // Handler para "Nova Credencial"
  const handleNovaCredencial = useCallback(() => {
    setSelectedAdvogadoId(null);
    setSelecionarAdvogadoDialog(true);
  }, []);

  // Confirmar seleção de advogado e abrir dialog de credenciais
  const handleConfirmarAdvogado = useCallback(() => {
    if (!selectedAdvogadoId) {
      toast.error('Selecione um advogado');
      return;
    }
    const advogado = advogadosList.find((a) => a.id === selectedAdvogadoId);
    if (!advogado) {
      toast.error('Advogado não encontrado');
      return;
    }
    setSelecionarAdvogadoDialog(false);
    setCredenciaisAdvogadoDialog({ open: true, advogado });
  }, [selectedAdvogadoId, advogadosList]);

  // Opções para filtros (extraídas dos dados)
  const tribunalOptions = useMemo(() => {
    const tribunais = [...new Set(credenciais.map((c) => c.tribunal))].sort();
    return tribunais.map((t) => ({ label: t, value: t }));
  }, [credenciais]);

  const grauOptions = useMemo(() => {
    const graus = [...new Set(credenciais.map((c) => c.grau))].sort();
    return graus.map((g) => ({ label: GRAU_LABELS[g] ?? g, value: g }));
  }, [credenciais]);

  const statusOptions = useMemo(() => [
    { label: 'Ativas', value: 'ativo' },
    { label: 'Inativas', value: 'inativo' },
  ], []);

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setRowSelection({});
  }, [buscaDebounced, tribunalFilter, grauFilter, statusFilter]);

  // Filtrar credenciais
  const credenciaisFiltradas = useMemo(() => {
    return credenciais.filter((credencial) => {
      // Filtro de busca
      if (buscaDebounced) {
        const buscaLower = buscaDebounced.toLowerCase();
        const oabMatch = credencial.advogado_oabs.some(
          (oab) =>
            oab.numero.toLowerCase().includes(buscaLower) ||
            oab.uf.toLowerCase().includes(buscaLower)
        );
        const match =
          credencial.advogado_nome.toLowerCase().includes(buscaLower) ||
          credencial.advogado_cpf.includes(buscaDebounced) ||
          oabMatch;

        if (!match) return false;
      }

      // Filtro de tribunal
      if (tribunalFilter !== 'all' && credencial.tribunal !== tribunalFilter) {
        return false;
      }

      // Filtro de grau
      if (grauFilter !== 'all' && credencial.grau !== grauFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'ativo';
        if (credencial.active !== isActive) {
          return false;
        }
      }

      return true;
    });
  }, [credenciais, buscaDebounced, tribunalFilter, grauFilter, statusFilter]);

  // Bulk actions helpers (deve ficar após credenciaisFiltradas)
  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const selectedCredenciais = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => credenciaisFiltradas[parseInt(idx)])
      .filter(Boolean);
  }, [rowSelection, credenciaisFiltradas]);

  const handleBulkToggle = useCallback((action: 'ativar' | 'desativar') => {
    setBulkToggleDialog({ open: true, action });
  }, []);

  const confirmarBulkToggle = async () => {
    const ids = selectedCredenciais.map((c) => c.id);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    try {
      const active = bulkToggleDialog.action === 'ativar';
      const result = await actionAtualizarStatusCredenciaisEmLote(ids, active);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar credenciais');
      }

      toast.success(
        `${ids.length} credencial(is) ${active ? 'ativada(s)' : 'desativada(s)'} com sucesso!`
      );

      setRowSelection({});
      setBulkToggleDialog({ open: false, action: 'desativar' });
      await buscarCredenciais();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar credenciais');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const colunas = useMemo(
    () =>
      criarColunasCredenciais({
        onViewAdvogado: handleViewAdvogado,
        onEdit: handleEdit,
        onToggleStatus: handleToggleStatus,
      }),
    [handleViewAdvogado, handleEdit, handleToggleStatus]
  );

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title={advogadoIdFromUrl ? 'Credenciais (filtrado por advogado)' : 'Credenciais'}
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={setBusca}
              searchPlaceholder="Buscar credenciais..."
              actionButton={{
                label: 'Nova Credencial',
                icon: <Plus className="h-4 w-4" />,
                onClick: handleNovaCredencial,
              }}
              actionSlot={
                selectedCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedCount} selecionada(s)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => handleBulkToggle('desativar')}
                    >
                      <PowerOff className="mr-1.5 h-4 w-4" />
                      Desativar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => handleBulkToggle('ativar')}
                    >
                      <Power className="mr-1.5 h-4 w-4" />
                      Ativar
                    </Button>
                  </div>
                ) : undefined
              }
              filtersSlot={
                <>
                  <AdvogadosFilter
                    title="Tribunal"
                    options={tribunalOptions}
                    value={tribunalFilter}
                    onValueChange={setTribunalFilter}
                  />
                  <AdvogadosFilter
                    title="Grau"
                    options={grauOptions}
                    value={grauFilter}
                    onValueChange={setGrauFilter}
                  />
                  <AdvogadosFilter
                    title="Status"
                    options={statusOptions}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
      >
        <DataTable
          data={credenciaisFiltradas}
          columns={colunas}
          isLoading={isLoading}
          error={error}
          density={density}
          emptyMessage="Nenhuma credencial encontrada."
          hidePagination={true}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
          }}
          onTableReady={(t) => setTable(t as TanstackTable<Credencial>)}
        />
      </DataShell>

      {/* Dialog de visualização do advogado */}
      <AdvogadoViewDialog
        credencial={advogadoDialog.credencial}
        open={advogadoDialog.open}
        onOpenChange={(open) => setAdvogadoDialog({ ...advogadoDialog, open })}
      />

      {/* Dialog para selecionar advogado antes de criar credenciais */}
      <Dialog
        open={selecionarAdvogadoDialog}
        onOpenChange={setSelecionarAdvogadoDialog}
      >
        <DialogContent className="sm:max-w-112.5">
          <DialogHeader>
            <DialogTitle>Nova Credencial</DialogTitle>
            <DialogDescription>
              Selecione o advogado para cadastrar credenciais de acesso aos tribunais.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-2">
              <Label>Advogado</Label>
              <AdvogadoCombobox
                advogados={advogadosList}
                selectedId={selectedAdvogadoId}
                onSelectionChange={setSelectedAdvogadoId}
                isLoading={advogadosLoading}
                placeholder="Selecione um advogado..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelecionarAdvogadoDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAdvogado}
              disabled={!selectedAdvogadoId}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de credenciais do advogado (com cadastro em massa) */}
      <CredenciaisAdvogadoDialog
        open={credenciaisAdvogadoDialog.open}
        onOpenChangeAction={(open) =>
          setCredenciaisAdvogadoDialog({ ...credenciaisAdvogadoDialog, open })
        }
        advogado={credenciaisAdvogadoDialog.advogado}
        onRefreshAction={() => refetch()}
      />

      {/* Toggle status confirmation */}
      <AlertDialog
        open={toggleDialog.open}
        onOpenChange={(open) => setToggleDialog({ ...toggleDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'} credencial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.credencial?.active
                ? 'A credencial será desativada e não poderá ser usada para capturas.'
                : 'A credencial será ativada e poderá ser usada para capturas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarToggleStatus}>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk toggle status confirmation */}
      <AlertDialog
        open={bulkToggleDialog.open}
        onOpenChange={(open) => setBulkToggleDialog({ ...bulkToggleDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkToggleDialog.action === 'desativar' ? 'Desativar' : 'Ativar'}{' '}
              {selectedCount} credencial(is)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkToggleDialog.action === 'desativar'
                ? `${selectedCount} credencial(is) serão desativadas e não poderão ser usadas para capturas.`
                : `${selectedCount} credencial(is) serão ativadas e poderão ser usadas para capturas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarBulkToggle} disabled={isBulkLoading}>
              {isBulkLoading
                ? 'Processando...'
                : bulkToggleDialog.action === 'desativar'
                  ? 'Desativar'
                  : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
