'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Table as TanstackTable, RowSelectionState } from '@tanstack/react-table';
import { PowerOff, Power, KeyRound, CheckCircle2, XCircle, Landmark, List, LayoutGrid, Users } from 'lucide-react';
import { DataTable } from '@/components/shared/data-shell';
import { GlassPanel } from '@/components/shared/glass-panel';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
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
  const [_table, _setTable] = useState<TanstackTable<Credencial> | null>(null);
  const [density, _setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

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

  // View mode
  const [viewMode, setViewMode] = useState('tabela');

  // View options
  const CRED_VIEW_OPTIONS: ViewToggleOption[] = [
    { id: 'tabela', icon: List, label: 'Tabela' },
    { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  ];

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
  const _handleNovaCredencial = useCallback(() => {
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

  // Advogado filter
  const [advogadoFilter, setAdvogadoFilter] = useState<string>('all');

  // Opções para filtros (extraídas dos dados)
  const advogadoOptions = useMemo(() => {
    const advMap = new Map<number, string>();
    credenciais.forEach((c) => {
      if (!advMap.has(c.advogado_id)) advMap.set(c.advogado_id, c.advogado_nome);
    });
    return Array.from(advMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, nome]) => ({ label: nome, value: String(id) }));
  }, [credenciais]);

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
  }, [buscaDebounced, tribunalFilter, grauFilter, statusFilter, advogadoFilter]);

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

      // Filtro de advogado
      if (advogadoFilter !== 'all' && String(credencial.advogado_id) !== advogadoFilter) {
        return false;
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
  }, [credenciais, buscaDebounced, advogadoFilter, tribunalFilter, grauFilter, statusFilter]);

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

  const kpiItems = useMemo<PulseItem[]>(() => {
    const ativas = credenciais.filter((c) => c.active).length;
    const inativas = credenciais.filter((c) => !c.active).length;
    const tribunaisCobertos = new Set(credenciais.filter((c) => c.active).map((c) => c.tribunal)).size;
    return [
      { label: 'Total Credenciais', total: credenciais.length, icon: KeyRound, color: 'text-primary' },
      { label: 'Ativas', total: ativas, icon: CheckCircle2, color: 'text-success' },
      { label: 'Inativas', total: inativas, icon: XCircle, color: 'text-warning' },
      { label: 'Tribunais Cobertos', total: tribunaisCobertos, icon: Landmark, color: 'text-info' },
    ];
  }, [credenciais]);

  return (
    <>
      <div className="space-y-5">
        {/* KPI Strip */}
        <PulseStrip items={kpiItems} />

        {/* Filter Bar */}
        <GlassPanel depth={1} className="px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <AdvogadosFilter
                title="Advogado"
                options={advogadoOptions}
                value={advogadoFilter}
                onValueChange={setAdvogadoFilter}
              />
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
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <SearchInput
                value={busca}
                onChange={setBusca}
                placeholder="Buscar credenciais..."
              />
              <ViewToggle mode={viewMode} onChange={setViewMode} options={CRED_VIEW_OPTIONS} />
            </div>
          </div>
        </GlassPanel>

        {/* Table View */}
        {viewMode === 'tabela' && (
          <>
            <GlassPanel depth={1} className="overflow-hidden relative">
              <div className="flex items-center px-4 py-2.5 border-b border-white/5">
                <span className="text-xs text-muted-foreground/60">
                  {credenciaisFiltradas.length} credenciais
                </span>
              </div>
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
                onTableReady={(t) => _setTable(t as TanstackTable<Credencial>)}
              />

              {/* Sticky Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="sticky bottom-0 left-0 right-0 flex items-center gap-3 bg-primary/95 backdrop-blur-sm border-t border-primary-foreground/12 px-5 py-2.5 text-primary-foreground rounded-b-2xl">
                  <span className="text-sm font-semibold flex-1">{selectedCount} selecionada(s)</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary-foreground/12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => handleBulkToggle('ativar')}
                  >
                    <Power className="size-3.5 mr-1" /> Ativar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary-foreground/12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => handleBulkToggle('desativar')}
                  >
                    <PowerOff className="size-3.5 mr-1" /> Desativar
                  </Button>
                </div>
              )}
            </GlassPanel>
          </>
        )}

        {/* Card View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
              ))
            ) : credenciaisFiltradas.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={KeyRound}
                  title="Nenhuma credencial encontrada"
                  description="Ajuste os filtros ou cadastre uma nova credencial."
                />
              </div>
            ) : (
              credenciaisFiltradas.map((credencial) => (
                <GlassPanel key={credencial.id} depth={2} className="p-4">
                  {/* Tribunal + Grau header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{credencial.tribunal}</div>
                      <div className="text-xs text-muted-foreground/55">
                        {GRAU_LABELS[credencial.grau] ?? credencial.grau}
                      </div>
                    </div>
                    {/* Status dot */}
                    <div className="ml-auto flex items-center gap-1.5">
                      <div className={cn('size-2 rounded-full', credencial.active ? 'bg-success' : 'bg-muted-foreground/40')} />
                      <span className={cn('text-[11px] font-medium', credencial.active ? 'text-success' : 'text-muted-foreground/50')}>
                        {credencial.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/10 my-2" />

                  {/* Advogado info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <Users className="size-3 shrink-0" />
                      <span className="truncate">{credencial.advogado_nome}</span>
                    </div>
                    {credencial.usuario && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <KeyRound className="size-3 shrink-0" />
                        <span className="font-mono text-[11px]">{credencial.usuario}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/10 mt-3 pt-3" />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs h-7" onClick={() => handleToggleStatus(credencial)}>
                      {credencial.active ? (
                        <><PowerOff className="size-3 mr-1" />Desativar</>
                      ) : (
                        <><Power className="size-3 mr-1" />Ativar</>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleEdit(credencial)}>
                      Editar
                    </Button>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>
        )}
      </div>

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
