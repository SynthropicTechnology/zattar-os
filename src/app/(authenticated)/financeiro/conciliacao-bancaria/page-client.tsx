'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, Wand2, MoreHorizontal, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { PageShell } from '@/components/shared/page-shell';
import {
  AlertasConciliacao,
  calcularPeriodo,
  ConciliarManualDialog,
  conciliarAutomaticamente as conciliarAutomaticamenteMutation,
  conciliarManual,
  desconciliar,
  ImportarExtratoDialog,
  type PeriodoFilter,
  type StatusConciliacaoFilter,
  useContasBancarias,
  useTransacoesImportadas,
} from '@/app/(authenticated)/financeiro';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { useDebounce } from '@/hooks/use-debounce';
import type { TransacaoComConciliacao } from '@/app/(authenticated)/financeiro';

// =============================================================================
// HELPERS
// =============================================================================

const formatarData = (data: string) => format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });

const formatarValor = (valor: number, tipo: 'credito' | 'debito') =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(tipo === 'debito' ? -valor : valor);

const STATUS_VARIANTS: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  conciliado: { label: 'Conciliado', variant: 'success' },
  divergente: { label: 'Divergente', variant: 'destructive' },
  ignorado: { label: 'Ignorado', variant: 'outline' },
};

const TIPO_VARIANTS: Record<'credito' | 'debito', { label: string; variant: 'success' | 'destructive' }> = {
  credito: { label: 'Crédito', variant: 'success' },
  debito: { label: 'Débito', variant: 'destructive' },
};

// =============================================================================
// COLUMNS
// =============================================================================

function getColumns(
  onConciliar: (t: TransacaoComConciliacao) => void,
  onDesconciliar: (t: TransacaoComConciliacao) => void,
  onIgnorar: (t: TransacaoComConciliacao) => void,
  onVerDetalhes: (t: TransacaoComConciliacao) => void,
): ColumnDef<TransacaoComConciliacao>[] {
  return [
    {
      accessorKey: 'dataTransacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      meta: { align: 'left' as const, headerLabel: 'Data' },
      cell: ({ row }) => <span className="text-sm">{formatarData(row.original.dataTransacao)}</span>,
      enableSorting: true,
      size: 100,
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
      meta: { align: 'left' as const, headerLabel: 'Descrição' },
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm" title={row.original.descricao}>
          {row.original.descricao}
        </div>
      ),
      size: 260,
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
      meta: { align: 'right' as const, headerLabel: 'Valor' },
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {formatarValor(row.original.valor, row.original.tipoTransacao)}
        </div>
      ),
      size: 120,
      enableSorting: true,
    },
    {
      accessorKey: 'tipoTransacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
      meta: { align: 'left' as const, headerLabel: 'Tipo' },
      cell: ({ row }) => {
        const tipo = row.original.tipoTransacao;
        const config = TIPO_VARIANTS[tipo as 'credito' | 'debito'];
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      size: 100,
    },
    {
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Conciliação" />,
      meta: { align: 'left' as const, headerLabel: 'Conciliação' },
      cell: ({ row }) => {
        const status = row.original.conciliacao?.status || 'pendente';
        const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.pendente;
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      size: 140,
    },
    {
      id: 'lancamento',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lançamento" />,
      meta: { align: 'left' as const, headerLabel: 'Lançamento' },
      cell: ({ row }) => {
        const lanc = row.original.lancamentoVinculado;
        return lanc ? (
          <div className="max-w-xs truncate text-sm" title={lanc.descricao}>
            {lanc.descricao}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Não conciliado</span>
        );
      },
      size: 200,
    },
    {
      id: 'acoes',
      header: () => <div className="text-sm font-medium">Ações</div>,
      meta: { align: 'left' as const },
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const transacao = row.original;
        const status = transacao.conciliacao?.status || 'pendente';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === 'pendente' && (
                <>
                  <DropdownMenuItem onClick={() => onConciliar(transacao)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Conciliar Manualmente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onIgnorar(transacao)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Marcar como Ignorado
                  </DropdownMenuItem>
                </>
              )}
              {status === 'conciliado' && (
                <DropdownMenuItem onClick={() => onDesconciliar(transacao)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desconciliar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onVerDetalhes(transacao)}>
                <Info className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function ConciliacaoBancariaPage() {
  const [importarOpen, setImportarOpen] = React.useState(false);
  const [conciliarOpen, setConciliarOpen] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusConciliacaoFilter>('todos');
  const [periodoFiltro, setPeriodoFiltro] = React.useState<PeriodoFilter>('todos');
  const [contaFiltro, setContaFiltro] = React.useState<number | 'todos'>('todos');
  const [selectedTransacao, setSelectedTransacao] = React.useState<TransacaoComConciliacao | null>(null);
  const [autoDialogOpen, setAutoDialogOpen] = React.useState(false);
  const [table, setTable] = React.useState<TanstackTable<TransacaoComConciliacao> | null>(null);
  const router = useRouter();

  const buscaDebounced = useDebounce(busca, 400);
  const { contasBancarias } = useContasBancarias();

  // Build API params from filters
  const filtersParsed = React.useMemo(() => {
    const periodoRange = calcularPeriodo(periodoFiltro);
    return {
      statusConciliacao: statusFiltro === 'todos' ? undefined : statusFiltro,
      contaBancariaId: contaFiltro === 'todos' ? undefined : contaFiltro,
      ...periodoRange,
      busca: buscaDebounced || undefined,
      pagina: 1,
      limite: 50,
    };
  }, [statusFiltro, periodoFiltro, contaFiltro, buscaDebounced]);

  const { transacoes, resumo, isLoading, error, refetch } = useTransacoesImportadas(filtersParsed);

  const handleConciliar = React.useCallback((transacao: TransacaoComConciliacao) => {
    setSelectedTransacao(transacao);
    setConciliarOpen(true);
  }, []);

  const handleIgnorar = React.useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await conciliarManual({ transacaoImportadaId: transacao.id, lancamentoFinanceiroId: null });
      toast.success('Transação marcada como ignorada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ignorar transação');
    }
  }, [refetch]);

  const handleDesconciliar = React.useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await desconciliar(transacao.id);
      toast.success('Transação desconciliada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconciliar');
    }
  }, [refetch]);

  const handleConciliarAutomaticamente = async () => {
    try {
      if (contaFiltro === 'todos') {
        toast.error('Selecione uma conta bancária para conciliação automática');
        return;
      }
      await conciliarAutomaticamenteMutation();
      toast.success('Conciliação automática iniciada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conciliar automaticamente');
    } finally {
      setAutoDialogOpen(false);
    }
  };

  const handleVerDetalhes = React.useCallback((transacao: TransacaoComConciliacao) => {
    router.push(`/financeiro/conciliacao-bancaria/${transacao.id}`);
  }, [router]);

  // Colunas com callbacks
  const columns = React.useMemo(
    () => getColumns(handleConciliar, handleDesconciliar, handleIgnorar, handleVerDetalhes),
    [handleConciliar, handleDesconciliar, handleIgnorar, handleVerDetalhes]
  );

  // Options para FilterPopover
  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'conciliado', label: 'Conciliado' },
    { value: 'divergente', label: 'Divergente' },
    { value: 'ignorado', label: 'Ignorado' },
  ];

  const periodoOptions = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
  ];

  const contasOptions = (contasBancarias || []).map((conta) => ({
    value: conta.id.toString(),
    label: conta.nome,
  }));

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Linha 1: Título + Botão Importar Extrato */}
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Conciliação Bancária</h1>
          <Button onClick={() => setImportarOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar Extrato
          </Button>
        </div>

        {/* Cards de resumo */}
        <AlertasConciliacao
          resumo={resumo}
          isLoading={isLoading}
          onFiltrarPendentes={() => setStatusFiltro('pendente')}
          onFiltrarDivergentes={() => setStatusFiltro('divergente')}
        />

        {/* DataShell com tabela de transações */}
        <DataShell
          header={
            <DataTableToolbar
              table={table ?? undefined}
              searchValue={busca}
              onSearchValueChange={setBusca}
              searchPlaceholder="Buscar por descrição ou documento..."
              filtersSlot={
                <>
                  <FilterPopover
                    label="Status"
                    options={statusOptions}
                    value={statusFiltro === 'todos' ? 'all' : statusFiltro}
                    onValueChange={(val) => setStatusFiltro(val === 'all' ? 'todos' : val as StatusConciliacaoFilter)}
                    defaultValue="all"
                  />
                  <FilterPopover
                    label="Período"
                    options={periodoOptions}
                    value={periodoFiltro === 'todos' ? 'all' : periodoFiltro}
                    onValueChange={(val) => setPeriodoFiltro(val === 'all' ? 'todos' : val as PeriodoFilter)}
                    defaultValue="all"
                  />
                  {contasOptions.length > 0 && (
                    <FilterPopover
                      label="Conta Bancária"
                      options={contasOptions}
                      value={contaFiltro === 'todos' ? 'all' : contaFiltro.toString()}
                      onValueChange={(val) => setContaFiltro(val === 'all' ? 'todos' : Number(val))}
                      defaultValue="all"
                    />
                  )}
                  <Button
                    variant="outline"
                    className="h-9 border-dashed bg-card"
                    onClick={() => setAutoDialogOpen(true)}
                  >
                    <Wand2 className="h-4 w-4" />
                    Conciliar Auto
                  </Button>
                </>
              }
            />
          }
        >
          {error && (
            <div className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DataTable
            data={transacoes}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Nenhuma transação importada"
            onTableReady={(t) => setTable(t as TanstackTable<TransacaoComConciliacao>)}
          />
        </DataShell>

        {/* Dialogs */}
        <ImportarExtratoDialog
          open={importarOpen}
          onOpenChange={setImportarOpen}
          onSuccess={refetch}
        />

        <ConciliarManualDialog
          open={conciliarOpen}
          onOpenChange={setConciliarOpen}
          transacao={selectedTransacao}
          onSuccess={refetch}
        />

        <AlertDialog open={autoDialogOpen} onOpenChange={setAutoDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conciliação automática</AlertDialogTitle>
              <AlertDialogDescription>
                O sistema vai analisar transações pendentes e conciliar automaticamente quando o score for maior ou igual a 90.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConciliarAutomaticamente}>Prosseguir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}
