'use client';

/**
 * Página de Detalhes do Orçamento
 * Visualiza informações completas e itens do orçamento
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  aprovarOrcamento,
  encerrarOrcamento,
  excluirItemOrcamento,
  ExportButton,
  iniciarExecucaoOrcamento,
  OrcamentoFormDialog,
  OrcamentoItemDialog,
  type OrcamentoItemComDetalhes,
  type StatusOrcamento,
  useOrcamento,
} from '@/app/(authenticated)/financeiro';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Archive,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';
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
import type { ColumnDef } from '@tanstack/react-table';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; variant: BadgeVariant }> = {
  rascunho: { label: 'Rascunho', variant: 'outline' },
  aprovado: { label: 'Aprovado', variant: 'info' },
  em_execucao: { label: 'Em Execução', variant: 'success' },
  encerrado: { label: 'Encerrado', variant: 'neutral' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

const PERIODO_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

// ============================================================================
// Componente de Ações dos Itens
// ============================================================================

function ItemActions({
  item,
  onEditar,
  onExcluir,
  disabled,
}: {
  item: OrcamentoItemComDetalhes;
  onEditar: (item: OrcamentoItemComDetalhes) => void;
  onExcluir: (item: OrcamentoItemComDetalhes) => void;
  disabled: boolean;
}) {
  if (disabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do item</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditar(item)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onExcluir(item)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Definição das Colunas dos Itens
// ============================================================================

function criarColunasItens(
  onEditar: (item: OrcamentoItemComDetalhes) => void,
  onExcluir: (item: OrcamentoItemComDetalhes) => void,
  disabled: boolean
): ColumnDef<OrcamentoItemComDetalhes>[] {
  return [
    {
      accessorKey: 'contaContabil',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Conta Contábil" />
        </div>
      ),
      size: 250,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium">
              {item.contaContabil?.codigo} - {item.contaContabil?.nome}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'centroCusto',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Centro de Custo" />
        </div>
      ),
      size: 150,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {item.centroCusto?.nome || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'observacoes',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Observações" />
        </div>
      ),
      size: 200,
      cell: ({ row }) => {
        return (
          <div className="min-h-10 flex items-center justify-start text-sm text-muted-foreground">
            {row.getValue('observacoes') || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'valorPrevisto',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor Previsto" />
        </div>
      ),
      size: 130,
      cell: ({ row }) => {
        const valor = row.getValue('valorPrevisto') as number;
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(valor)}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      size: 80,
      cell: ({ row }) => {
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ItemActions
              item={row.original}
              onEditar={onEditar}
              onExcluir={onExcluir}
              disabled={disabled}
            />
          </div>
        );
      },
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function OrcamentoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const orcamentoId = parseInt(params.id as string, 10);

  // Estados
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<OrcamentoItemComDetalhes | null>(null);
  const [excluirItemDialogOpen, setExcluirItemDialogOpen] = React.useState(false);
  const [aprovarDialogOpen, setAprovarDialogOpen] = React.useState(false);
  const [iniciarDialogOpen, setIniciarDialogOpen] = React.useState(false);
  const [encerrarDialogOpen, setEncerrarDialogOpen] = React.useState(false);

  // Dados
  const { orcamento, isLoading, error, refetch } = useOrcamento(orcamentoId);

  // Verificações de status
  const isRascunho = orcamento?.status === 'rascunho';
  const isAprovado = orcamento?.status === 'aprovado';
  const isEmExecucao = orcamento?.status === 'em_execucao';

  // Cálculos
  const totalPrevisto = React.useMemo(() => {
    return orcamento?.itens?.reduce((sum, item) => sum + item.valorPrevisto, 0) || 0;
  }, [orcamento?.itens]);

  // Handlers
  const handleVoltar = () => {
    router.push('/financeiro/orcamentos');
  };

  const handleEditar = () => {
    setFormDialogOpen(true);
  };

  const handleNovoItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditarItem = (item: OrcamentoItemComDetalhes) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleExcluirItem = (item: OrcamentoItemComDetalhes) => {
    setSelectedItem(item);
    setExcluirItemDialogOpen(true);
  };

  const handleConfirmExcluirItem = async () => {
    if (!selectedItem) return;

    try {
      const resultado = await excluirItemOrcamento(orcamentoId, selectedItem.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Item excluído com sucesso');
      setExcluirItemDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir item';
      toast.error(message);
    }
  };

  const handleConfirmAprovar = async () => {
    try {
      const resultado = await aprovarOrcamento(orcamentoId);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento aprovado com sucesso');
      setAprovarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao aprovar orçamento';
      toast.error(message);
    }
  };

  const handleConfirmIniciar = async () => {
    try {
      const resultado = await iniciarExecucaoOrcamento(orcamentoId);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Execução iniciada com sucesso');
      setIniciarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao iniciar execução';
      toast.error(message);
    }
  };

  const handleConfirmEncerrar = async () => {
    try {
      const resultado = await encerrarOrcamento(orcamentoId);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento encerrado com sucesso');
      setEncerrarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encerrar orçamento';
      toast.error(message);
    }
  };

  const handleVerAnalise = () => {
    router.push(`/financeiro/orcamentos/${orcamentoId}/analise`);
  };

  // Colunas dos itens
  const colunasItens = React.useMemo(
    () => criarColunasItens(handleEditarItem, handleExcluirItem, !isRascunho),
    [isRascunho]
  );

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erro
  if (error || !orcamento) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar orçamento</p>
          <p>{error || 'Orçamento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[orcamento.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {(isEmExecucao || orcamento.status === 'encerrado') && (
            <Button variant="outline" onClick={handleVerAnalise}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Análise
            </Button>
          )}
          {isRascunho && (
            <>
              <Button variant="outline" onClick={handleEditar}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button onClick={() => setAprovarDialogOpen(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            </>
          )}
          {isAprovado && (
            <Button onClick={() => setIniciarDialogOpen(true)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Iniciar Execução
            </Button>
          )}
          {isEmExecucao && (
            <Button variant="outline" onClick={() => setEncerrarDialogOpen(true)}>
              <Archive className="mr-2 h-4 w-4" />
              Encerrar
            </Button>
          )}
          <ExportButton
            endpoint={`/api/financeiro/orcamentos/${orcamento.id}/exportar`}
            opcoes={[
              { label: 'Relatório Completo (PDF)', formato: 'pdf' },
              { label: 'Análise (CSV)', formato: 'csv' },
              { label: 'Evolução (CSV)', formato: 'excel' },
            ]}
          />
        </div>
      </div>

      {/* Cards de Informações */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ano</CardDescription>
            <CardTitle className="text-2xl">{orcamento.ano}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Período</CardDescription>
            <CardTitle className="text-2xl">
              {PERIODO_LABELS[orcamento.periodo] || orcamento.periodo}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vigência</CardDescription>
            <CardTitle className="text-lg">
              {formatarData(orcamento.dataInicio)} - {formatarData(orcamento.dataFim)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Previsto</CardDescription>
            <CardTitle className="text-2xl font-mono">{formatarValor(totalPrevisto)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Itens do Orçamento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Itens do Orçamento</CardTitle>
            <CardDescription>
              {orcamento.itens?.length || 0} itens cadastrados
            </CardDescription>
          </div>
          {isRascunho && (
            <Button onClick={handleNovoItem}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            data={orcamento.itens || []}
            columns={colunasItens}
            emptyMessage="Nenhum item cadastrado neste orçamento."
          />
        </CardContent>
      </Card>

      {/* Observações */}
      {orcamento.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{orcamento.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <OrcamentoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        orcamento={orcamento}
        onSuccess={refetch}
      />

      <OrcamentoItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        orcamentoId={orcamentoId}
        item={selectedItem}
        onSuccess={refetch}
      />

      {/* Dialog Excluir Item */}
      <AlertDialog open={excluirItemDialogOpen} onOpenChange={setExcluirItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item do orçamento?
              {selectedItem && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedItem.contaContabil?.nome} - {formatarValor(selectedItem.valorPrevisto)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluirItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Aprovar */}
      <AlertDialog open={aprovarDialogOpen} onOpenChange={setAprovarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar este orçamento?
              <span className="block mt-2 text-muted-foreground">
                Após aprovado, o orçamento poderá ser iniciado para execução.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAprovar}>Aprovar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Iniciar */}
      <AlertDialog open={iniciarDialogOpen} onOpenChange={setIniciarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Execução</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja iniciar a execução deste orçamento?
              <span className="block mt-2 text-muted-foreground">
                Os lançamentos financeiros passarão a ser comparados com este orçamento.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmIniciar}>Iniciar Execução</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Encerrar */}
      <AlertDialog open={encerrarDialogOpen} onOpenChange={setEncerrarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar este orçamento?
              <span className="block mt-2 text-orange-600">
                Após encerrado, o orçamento ficará disponível apenas para consulta.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEncerrar}>Encerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
