'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  Play,
  Pause,
  Zap,
  TrendingUp,
  Clock,
  Plus,
  MoreHorizontal,
  Trash,
  Power,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/shared/glass-panel';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { SearchInput } from '@/components/dashboard/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useDebounce } from '@/hooks/use-debounce';

import type { Agendamento } from '@/app/(authenticated)/captura';
import { AgendamentoDialog } from '../components/agendamento-dialog';
import { useAdvogadosMap } from '../hooks/use-advogados-map';

// =============================================================================
// HELPERS
// =============================================================================

const TIPO_LABELS: Record<string, string> = {
  acervo_geral: 'Acervo Geral',
  arquivados: 'Arquivados',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  pericias: 'Perícias',
  combinada: 'Combinada',
  timeline: 'Timeline',
  partes: 'Partes',
};

const TIPO_COLORS: Record<string, string> = {
  acervo_geral: 'bg-primary/8 text-primary border-primary/15',
  audiencias: 'bg-info/8 text-info border-info/15',
  combinada: 'bg-warning/8 text-warning border-warning/15',
  timeline: 'bg-success/8 text-success border-success/15',
  pericias: 'bg-destructive/8 text-destructive border-destructive/15',
  pendentes: 'bg-info/8 text-info border-info/15',
  partes: 'bg-primary/8 text-primary border-primary/15',
  arquivados: 'bg-muted-foreground/8 text-muted-foreground border-muted-foreground/15',
};

function formatarPeriodicidade(agendamento: Agendamento): string {
  if (agendamento.periodicidade === 'diario') {
    return `Diária ${agendamento.horario}`;
  }
  if (agendamento.dias_intervalo) {
    return `A cada ${agendamento.dias_intervalo}d ${agendamento.horario}`;
  }
  return agendamento.horario;
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${min}`;
  } catch {
    return '—';
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca, 500);
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agendamentoToDelete, setAgendamentoToDelete] = useState<Agendamento | null>(null);

  const { advogadosMap } = useAdvogadosMap();

  // Fetch agendamentos
  const fetchAgendamentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/captura/agendamentos');
      if (!res.ok) throw new Error('Erro ao listar agendamentos');
      const json = await res.json();
      if (!json.success) throw new Error('Resposta inválida');
      const data = Array.isArray(json.data) ? json.data : (json.data?.agendamentos ?? json.data?.data ?? []);
      setAgendamentos(data);
    } catch {
      setAgendamentos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  // Actions
  const handleExecutar = useCallback(async (agendamento: Agendamento) => {
    try {
      toast.info('Iniciando execução...');
      const res = await fetch(`/api/captura/agendamentos/${agendamento.id}/executar`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao executar');
      toast.success('Agendamento disparado com sucesso');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao executar');
    }
  }, []);

  const handleToggleAtivo = useCallback(async (agendamento: Agendamento) => {
    try {
      const novoStatus = !agendamento.ativo;
      const res = await fetch(`/api/captura/agendamentos/${agendamento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      toast.success(`Agendamento ${novoStatus ? 'ativado' : 'desativado'}`);
      fetchAgendamentos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar');
    }
  }, [fetchAgendamentos]);

  const handleDelete = useCallback((agendamento: Agendamento) => {
    setAgendamentoToDelete(agendamento);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!agendamentoToDelete) return;
    try {
      const res = await fetch(`/api/captura/agendamentos/${agendamentoToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      toast.success('Agendamento excluído');
      fetchAgendamentos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setDeleteDialogOpen(false);
      setAgendamentoToDelete(null);
    }
  }, [agendamentoToDelete, fetchAgendamentos]);

  // Filtering
  const filteredAgendamentos = useMemo(() => {
    if (!buscaDebounced) return agendamentos;
    const q = buscaDebounced.toLowerCase();
    return agendamentos.filter((a) => {
      const tipoLabel = (TIPO_LABELS[a.tipo_captura] ?? a.tipo_captura).toLowerCase();
      const advNome = a.advogado_id ? (advogadosMap.get(a.advogado_id) ?? '').toLowerCase() : '';
      return tipoLabel.includes(q) || advNome.includes(q);
    });
  }, [agendamentos, buscaDebounced, advogadosMap]);

  // KPIs
  const kpiItems = useMemo<PulseItem[]>(() => {
    const ativos = agendamentos.filter((a) => a.ativo).length;
    const hoje = new Date().toDateString();
    const execucoesHoje = agendamentos.filter((a) => {
      if (!a.proxima_execucao) return false;
      return new Date(a.proxima_execucao).toDateString() === hoje;
    }).length;
    const proximaExec = agendamentos
      .filter((a) => a.ativo && a.proxima_execucao)
      .sort((a, b) => new Date(a.proxima_execucao).getTime() - new Date(b.proxima_execucao).getTime())[0];
    const proximaLabel = proximaExec ? new Date(proximaExec.proxima_execucao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';

    return [
      { label: 'Ativos', total: ativos, icon: CalendarClock, color: 'text-primary' },
      { label: 'Execuções Hoje', total: execucoesHoje, icon: Zap, color: 'text-info' },
      { label: 'Próxima Execução', total: proximaLabel as unknown as number, icon: Clock, color: 'text-success' },
      { label: 'Total', total: agendamentos.length, icon: TrendingUp, color: 'text-muted-foreground' },
    ];
  }, [agendamentos]);

  return (
    <>
      <div className="space-y-5">
        {/* KPI Strip */}
        <PulseStrip items={kpiItems} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">
              {filteredAgendamentos.length} agendamento{filteredAgendamentos.length !== 1 ? 's' : ''}
            </span>
            {agendamentos.filter((a) => a.ativo).length > 0 && (
              <>
                <div className="w-px h-4 bg-border/10" />
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  {agendamentos.filter((a) => a.ativo).length} ativos
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar agendamentos..." />
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => setAgendamentoDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              Novo
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <GlassPanel depth={1} className="overflow-hidden">
            <div className="space-y-0">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="px-4 py-3 border-b border-border/5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-32 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Glass Table */}
        {!isLoading && filteredAgendamentos.length > 0 && (
          <GlassPanel depth={1} className="overflow-hidden">
            {/* Column Headers */}
            <div className="grid grid-cols-[70px_1fr_100px_140px_100px_100px_44px] gap-3 items-center px-4 py-2.5 border-b border-white/5">
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Status</span>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Nome / Tipo</span>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Frequência</span>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Próxima Exec.</span>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Última Exec.</span>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Advogado</span>
              <div />
            </div>

            {/* Rows */}
            {filteredAgendamentos.map((agendamento, i) => {
              const advNome = agendamento.advogado_id ? advogadosMap.get(agendamento.advogado_id) : undefined;
              const tipoColor = TIPO_COLORS[agendamento.tipo_captura] ?? 'bg-muted/8 text-muted-foreground border-border/15';

              return (
                <div
                  key={agendamento.id}
                  className={`grid grid-cols-[70px_1fr_100px_140px_100px_100px_44px] gap-3 items-center px-4 py-3 transition-colors hover:bg-primary/2 ${i < filteredAgendamentos.length - 1 ? 'border-b border-white/3' : ''}`}
                >
                  {/* Status badge */}
                  <div>
                    {agendamento.ativo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/8 border border-success/15 px-1.5 py-0.5 rounded-md">
                        <span className="size-1.5 rounded-full bg-success" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/8 border border-warning/15 px-1.5 py-0.5 rounded-md">
                        <Pause className="size-2.5" />
                        Pausado
                      </span>
                    )}
                  </div>

                  {/* Nome + Tipo badge */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border shrink-0 ${tipoColor}`}>
                      {TIPO_LABELS[agendamento.tipo_captura] ?? agendamento.tipo_captura}
                    </span>
                  </div>

                  {/* Frequência */}
                  <div>
                    <span className="text-xs text-muted-foreground/70">
                      {formatarPeriodicidade(agendamento)}
                    </span>
                  </div>

                  {/* Próxima Execução */}
                  <div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatarDataHora(agendamento.proxima_execucao)}
                    </span>
                  </div>

                  {/* Última Execução */}
                  <div>
                    <span className="text-xs text-muted-foreground/60 tabular-nums">
                      {formatarDataHora(agendamento.ultima_execucao)}
                    </span>
                  </div>

                  {/* Advogado */}
                  <div>
                    <span className="text-xs text-muted-foreground/60 truncate block">
                      {advNome ?? `ID ${agendamento.advogado_id}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="size-7 rounded-md flex items-center justify-center text-muted-foreground/45 hover:bg-muted/30 hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExecutar(agendamento)}>
                          <Play className="mr-2 h-4 w-4" />
                          Executar agora
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleAtivo(agendamento)}>
                          {agendamento.ativo ? (
                            <>
                              <Ban className="mr-2 h-4 w-4 text-warning" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4 text-success" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(agendamento)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </GlassPanel>
        )}

        {/* Empty State */}
        {!isLoading && filteredAgendamentos.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="Nenhum agendamento encontrado"
            description="Crie um novo agendamento para automatizar capturas."
          />
        )}
      </div>

      {/* New Agendamento Dialog */}
      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={() => {
          fetchAgendamentos();
          setAgendamentoDialogOpen(false);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O agendamento
              {agendamentoToDelete ? ` do tipo "${TIPO_LABELS[agendamentoToDelete.tipo_captura] ?? agendamentoToDelete.tipo_captura}"` : ''} será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
