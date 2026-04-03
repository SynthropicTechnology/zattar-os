'use client';

import * as React from 'react';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Play,
  Trash,
  Power,
  Ban
} from 'lucide-react';

import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import type { Agendamento } from '@/app/(authenticated)/captura';

type ApiOk = { success: true; data: { agendamentos: Agendamento[] } | { data: Agendamento[] } | Agendamento[] };

function isApiOk(value: unknown): value is ApiOk {
  return !!value && typeof value === 'object' && 'success' in value && (value as { success?: unknown }).success === true;
}

function extractAgendamentos(payload: ApiOk['data']): Agendamento[] {
  if (Array.isArray(payload)) return payload;
  if ('agendamentos' in payload && Array.isArray((payload as { agendamentos?: unknown }).agendamentos)) {
    return (payload as { agendamentos: Agendamento[] }).agendamentos;
  }
  if ('data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Agendamento[] }).data;
  }
  return [];
}

function formatTipoCaptura(tipo: string): string {
  switch (tipo) {
    case 'acervo_geral':
      return 'Acervo geral';
    case 'arquivados':
      return 'Arquivados';
    case 'audiencias':
      return 'Audiências';
    case 'pendentes':
      return 'Pendentes';
    case 'pericias':
      return 'Perícias';
    case 'combinada':
      return 'Captura unificada';
    default:
      return tipo;
  }
}

interface AgendamentosListProps {
  onNewClick?: () => void;
}

export function AgendamentosList({ onNewClick }: AgendamentosListProps) {
  const [data, setData] = React.useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [table, setTable] = React.useState<TanstackTable<Agendamento> | null>(null);
  const [agendamentoToDelete, setAgendamentoToDelete] = React.useState<Agendamento | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const fetchAgendamentos = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/captura/agendamentos');
      if (!res.ok) throw new Error('Erro ao listar agendamentos');
      const json: unknown = await res.json();
      if (!isApiOk(json)) throw new Error('Resposta inválida ao listar agendamentos');

      const agendamentos = extractAgendamentos(json.data);
      setData(agendamentos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao listar agendamentos';
      setError(msg);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  const handleExecutar = React.useCallback(async (agendamento: Agendamento) => {
    try {
      toast.info('Iniciando execução...');
      const res = await fetch(`/api/captura/agendamentos/${agendamento.id}/executar`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao executar agendamento');
      toast.success('Agendamento disparado com sucesso');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao executar agendamento');
    }
  }, []);

  const handleToggleAtivo = React.useCallback(async (agendamento: Agendamento) => {
    try {
      const novoStatus = !agendamento.ativo;
      const res = await fetch(`/api/captura/agendamentos/${agendamento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status');

      toast.success(`Agendamento ${novoStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchAgendamentos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status');
    }
  }, [fetchAgendamentos]);

  const handleDelete = React.useCallback((agendamento: Agendamento) => {
    setAgendamentoToDelete(agendamento);
    setIsDeleteAlertOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!agendamentoToDelete) return;

    try {
      const res = await fetch(`/api/captura/agendamentos/${agendamentoToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir agendamento');

      toast.success('Agendamento excluído com sucesso');
      fetchAgendamentos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir agendamento');
    } finally {
      setIsDeleteAlertOpen(false);
      setAgendamentoToDelete(null);
    }
  }, [agendamentoToDelete, fetchAgendamentos]);

  const columns = React.useMemo<ColumnDef<Agendamento>[]>(
    () => [
      {
        accessorKey: 'tipo_captura',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => (
          <Badge variant="info">{formatTipoCaptura(row.original.tipo_captura)}</Badge>
        ),
        meta: { headerLabel: 'Tipo' },
      },
      {
        accessorKey: 'advogado_id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Advogado ID" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.advogado_id}</span>,
        meta: { headerLabel: 'Advogado ID' },
      },
      {
        accessorKey: 'horario',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Horário" />
        ),
        cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.horario}</span>,
        meta: { headerLabel: 'Horário' },
      },
      {
        accessorKey: 'proxima_execucao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Próxima execução" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.proxima_execucao ? new Date(row.original.proxima_execucao).toLocaleString('pt-BR') : '-'}
          </span>
        ),
        meta: { headerLabel: 'Próxima execução' },
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getSemanticBadgeVariant('status', row.original.ativo ? 'ATIVO' : 'INATIVO')}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
        meta: { headerLabel: 'Status' },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExecutar(row.original)}>
                  <Play className="mr-2 h-4 w-4" />
                  <span>Executar agora</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleAtivo(row.original)}>
                  {row.original.ativo ? (
                    <>
                      <Ban className="mr-2 h-4 w-4 text-orange-500" />
                      <span>Desativar</span>
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4 text-green-500" />
                      <span>Ativar</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(row.original)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: { headerLabel: 'Ações' },
      },
    ],
    [handleExecutar, handleToggleAtivo, handleDelete]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            title="Agendamentos"
            searchPlaceholder="Buscar agendamentos..."
            actionButton={
              onNewClick
                ? {
                  label: 'Novo Agendamento',
                  onClick: onNewClick,
                }
                : undefined
            }
          />
        ) : (
          <div className="p-6" />
        )
      }
    >
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhum agendamento encontrado."
        hidePagination
        onTableReady={(t) => setTable(t as TanstackTable<Agendamento>)}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o agendamento de captura
              {agendamentoToDelete && agendamentoToDelete.tipo_captura ? ` do tipo "${formatTipoCaptura(agendamentoToDelete.tipo_captura)}"` : ''}.
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
    </DataShell>
  );
}
