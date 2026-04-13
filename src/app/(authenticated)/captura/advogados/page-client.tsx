'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Users, ChevronRight, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataPagination } from '@/components/shared/data-shell/data-pagination';
import { GlassPanel } from '@/components/shared/glass-panel';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { SearchInput } from '@/components/dashboard/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { Heading } from '@/components/ui/typography';
import { Button, buttonVariants } from '@/components/ui/button';
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
  useAdvogados,
  actionCriarAdvogado,
  actionAtualizarAdvogado,
  type Advogado,
  type CriarAdvogadoParams,
  type AtualizarAdvogadoParams,
} from '@/app/(authenticated)/advogados';
import { UFS_BRASIL } from '@/app/(authenticated)/advogados';
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
  const { advogados, paginacao, isLoading, error: _error, refetch } = useAdvogados({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: buscaDebounced || undefined,
    uf_oab: ufFilter !== 'all' ? ufFilter : undefined,
  });

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

  // KPI items
  const kpiItems = useMemo<PulseItem[]>(() => {
    const total = paginacao?.total ?? advogados.length;
    return [
      { label: 'Total Advogados', total, icon: Users, color: 'text-primary' },
      { label: 'Com Credenciais', total: total, icon: Lock, color: 'text-success' },
      { label: 'Sem Credenciais', total: 0, icon: AlertTriangle, color: 'text-warning' },
    ];
  }, [paginacao, advogados.length]);

  // Opções para o filtro de UF
  const ufOptions = useMemo(() => {
    return UFS_BRASIL.map(uf => ({
      label: uf,
      value: uf
    }));
  }, []);

  return (
    <>
      <div className="space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <a href="/captura" className="hover:text-foreground transition-colors">Captura</a>
          <ChevronRight className="size-3" />
          <a href="/captura?tab=credenciais" className="hover:text-foreground transition-colors">Credenciais</a>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">Advogados</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <Heading level="page">Advogados</Heading>
            <p className="text-sm text-muted-foreground/50 mt-0.5">
              Gestão de advogados com acesso aos sistemas judiciais
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => setAdvogadoDialog({ open: true, advogado: null, mode: 'create' })}
          >
            <Plus className="size-3.5" />
            Novo Advogado
          </Button>
        </div>

        {/* KPI Strip */}
        <PulseStrip items={kpiItems} />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AdvogadosFilter
            title="UF"
            options={ufOptions}
            value={ufFilter}
            onValueChange={setUfFilter}
          />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar advogados..." />
          </div>
        </div>

        {/* Insight: advogados sem credenciais */}
        {!isLoading && advogados.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-warning/15 bg-warning/5 px-4 py-2.5 text-xs text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Alguns advogados podem não ter credenciais cadastradas — verifique na aba Credenciais.
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Card Grid */}
        {!isLoading && advogados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {advogados.map((advogado) => (
              <GlassPanel key={advogado.id} depth={2} className="p-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {advogado.nome_completo.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{advogado.nome_completo}</div>
                    <div className="text-xs text-muted-foreground/55">
                      {advogado.oabs.map((o: { numero: string; uf: string }) => `OAB/${o.uf} ${o.numero}`).join(', ') || 'Sem OAB'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/10 my-2" />

                {/* CPF */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <span className="font-medium text-muted-foreground/40 uppercase tracking-wide text-[10px]">CPF</span>
                    <span className="truncate">{advogado.cpf}</span>
                  </div>
                </div>

                <div className="border-t border-border/10 mt-3 pt-3" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs h-7 text-primary"
                    onClick={() => handleViewCredenciais(advogado)}
                  >
                    Ver Credenciais
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleEdit(advogado)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 w-7 p-0 text-muted-foreground/45 hover:text-destructive"
                    onClick={() => handleDelete(advogado)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && advogados.length === 0 && (
          <EmptyState
            icon={Users}
            title="Nenhum advogado encontrado"
            description="Ajuste os filtros ou cadastre um novo advogado."
          />
        )}

        {/* Pagination */}
        {paginacao && paginacao.totalPaginas > 1 && (
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            isLoading={isLoading}
          />
        )}
      </div>

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
    </>
  );
}
