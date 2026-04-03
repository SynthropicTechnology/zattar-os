'use client';

/**
 * Página de Contas a Pagar
 * Lista e gerencia contas a pagar do escritório
 *
 * Seguindo o padrão DataShell usado em contratos e partes
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { todayDateString, addDays } from '@/lib/date-utils';
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  cancelarConta,
  excluirConta,
  FiltroFornecedor,
  MaisFiltrosPopover,
  type Lancamento,
  type StatusLancamento,
  PagarContaDialog,
  useContasBancarias,
  useContasPagar,
} from '@/app/(authenticated)/financeiro';
import { PageShell } from '@/components/shared/page-shell';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  CreditCard,
  Pencil,
  XCircle,
  Eye,
  Repeat,
  Trash2,
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
import { cn } from '@/lib/utils';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const STATUS_CONFIG: Record<StatusLancamento, { label: string; variant: BadgeVariant }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  confirmado: { label: 'Pago', variant: 'success' },
  pago: { label: 'Pago', variant: 'success' },
  recebido: { label: 'Recebido', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'outline' },
  estornado: { label: 'Estornado', variant: 'destructive' },
};

const CATEGORIAS = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'custas_processuais', label: 'Custas Processuais' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

const isVencida = (conta: Lancamento): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(conta.dataVencimento) < hoje;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function ContasPagarActions({
  conta,
  onPagar,
  onEditar,
  onCancelar,
  onExcluir,
  onVerDetalhes,
}: {
  conta: Lancamento;
  onPagar: (conta: Lancamento) => void;
  onEditar: (conta: Lancamento) => void;
  onCancelar: (conta: Lancamento) => void;
  onExcluir: (conta: Lancamento) => void;
  onVerDetalhes: (conta: Lancamento) => void;
}) {
  const isPendente = conta.status === 'pendente';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(conta)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {isPendente && (
          <>
            <DropdownMenuItem onClick={() => onPagar(conta)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(conta)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCancelar(conta)} className="text-orange-600">
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExcluir(conta)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onPagar: (conta: Lancamento) => void,
  onEditar: (conta: Lancamento) => void,
  onCancelar: (conta: Lancamento) => void,
  onExcluir: (conta: Lancamento) => void,
  onVerDetalhes: (conta: Lancamento) => void
): ColumnDef<Lancamento>[] {
  return [
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{conta.descricao}</span>
              {conta.recorrencia && (
                <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recorrente" />
              )}
            </div>
            {conta.entidade && (
              <span className="text-xs text-muted-foreground">
                {conta.entidade.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'categoria',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Categoria" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const categoria = row.original.categoria;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {categoria ? (
              <Badge variant="outline" className="capitalize">
                {categoria}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const valor = row.getValue('valor') as number;
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(valor)}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataVencimento',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Vencimento" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const conta = row.original;
        const vencida = isVencida(conta);
        return (
          <div
            className={cn(
              'min-h-10 flex items-center justify-center text-sm',
              vencida && 'text-destructive font-medium'
            )}
          >
            {formatarData(conta.dataVencimento)}
            {vencida && (
              <Badge variant="destructive" className="ml-2">
                Vencida
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusLancamento;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
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
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ContasPagarActions
              conta={conta}
              onPagar={onPagar}
              onEditar={onEditar}
              onCancelar={onCancelar}
              onExcluir={onExcluir}
              onVerDetalhes={onVerDetalhes}
            />
          </div>
        );
      },
    },
  ];
}

// ============================================================================
// Página Principal
// ============================================================================

export default function ContasPagarPage() {
  const router = useRouter();
  // Estado da tabela
  const [table, setTable] = React.useState<TanstackTable<Lancamento> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de filtros e busca
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [status, setStatus] = React.useState<StatusLancamento | ''>('pendente');
  const [vencimento, setVencimento] = React.useState<string>('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [tipoRecorrente, setTipoRecorrente] = React.useState<string>('');
  const [formaPagamento, setFormaPagamento] = React.useState<string>('');
  const [contaContabilId, setContaContabilId] = React.useState<string>('');
  const [centroCustoId, setCentroCustoId] = React.useState<string>('');
  const [fornecedorId, setFornecedorId] = React.useState<string>('');

  // Estados de dialogs
  const [pagarDialogOpen, setPagarDialogOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<Lancamento | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Debounce da busca
  const globalFilterDebounced = useDebounce(globalFilter, 500);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    const hojeStr = todayDateString();
    let dataVencimentoInicio: string | undefined;
    let dataVencimentoFim: string | undefined;

    // Processar filtro de vencimento
    if (vencimento === 'vencidas') {
      dataVencimentoFim = addDays(hojeStr, -1);
    } else if (vencimento === 'hoje') {
      dataVencimentoInicio = hojeStr;
      dataVencimentoFim = hojeStr;
    } else if (vencimento === '7dias') {
      dataVencimentoInicio = hojeStr;
      dataVencimentoFim = addDays(hojeStr, 7);
    } else if (vencimento === '30dias') {
      dataVencimentoInicio = hojeStr;
      dataVencimentoFim = addDays(hojeStr, 30);
    }

    return {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: globalFilterDebounced || undefined,
      status: status || undefined,
      dataVencimentoInicio,
      dataVencimentoFim,
      categoria: categoria || undefined,
      recorrente: tipoRecorrente === 'recorrente' ? true : tipoRecorrente === 'avulsa' ? false : undefined,
      formaPagamento: formaPagamento || undefined,
      contaContabilId: contaContabilId ? Number(contaContabilId) : undefined,
      centroCustoId: centroCustoId ? Number(centroCustoId) : undefined,
      fornecedorId: fornecedorId ? Number(fornecedorId) : undefined,
      incluirResumo: true,
    };
  }, [
    pageIndex,
    pageSize,
    globalFilterDebounced,
    status,
    vencimento,
    categoria,
    tipoRecorrente,
    formaPagamento,
    contaContabilId,
    centroCustoId,
    fornecedorId,
  ]);

  // Hook de dados
  const { contasPagar, paginacao, isLoading, error, refetch } = useContasPagar(params);

  // Contas bancárias para os selects
  const { contasBancarias } = useContasBancarias();

  const handlePagar = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setPagarDialogOpen(true);
  }, []);

  const handleEditar = React.useCallback(() => {
    // TODO: Implementar dialog de edição
    toast.info('Funcionalidade de edição em desenvolvimento');
  }, []);

  const handleCancelar = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setCancelarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerDetalhes = React.useCallback((conta: Lancamento) => {
    router.push(`/app/financeiro/contas-pagar/${conta.id}`);
  }, [router]);

  const handleConfirmCancelar = React.useCallback(async () => {
    if (!selectedConta) return;

    try {
      await cancelarConta(selectedConta.id);
      toast.success('Conta cancelada com sucesso');
      setCancelarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar conta';
      toast.error(message);
    }
  }, [selectedConta, refetch]);

  const handleConfirmExcluir = React.useCallback(async () => {
    if (!selectedConta) return;

    try {
      await excluirConta(selectedConta.id);
      toast.success('Conta excluída com sucesso');
      setExcluirDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir conta';
      toast.error(message);
    }
  }, [selectedConta, refetch]);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes),
    [handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes]
  );

  // Opções de filtros
  const statusOptions = React.useMemo(
    () => [
      { value: 'pendente', label: 'Pendente' },
      { value: 'confirmado', label: 'Pago' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'estornado', label: 'Estornado' },
    ],
    []
  );

  const vencimentoOptions = React.useMemo(
    () => [
      { value: 'vencidas', label: 'Vencidas' },
      { value: 'hoje', label: 'Vencem hoje' },
      { value: '7dias', label: 'Próximos 7 dias' },
      { value: '30dias', label: 'Próximos 30 dias' },
    ],
    []
  );

  const categoriaOptions = React.useMemo(
    () => CATEGORIAS.map((cat) => ({ value: cat.value, label: cat.label })),
    []
  );

  const tipoRecorrenteOptions = React.useMemo(
    () => [
      { value: 'recorrente', label: 'Recorrentes' },
      { value: 'avulsa', label: 'Avulsas' },
    ],
    []
  );

  const formaPagamentoOptions = React.useMemo(
    () => [
      { value: 'dinheiro', label: 'Dinheiro' },
      { value: 'pix', label: 'PIX' },
      { value: 'transferencia_bancaria', label: 'Transferência' },
      { value: 'ted', label: 'TED' },
      { value: 'cartao_debito', label: 'Débito' },
      { value: 'cartao_credito', label: 'Crédito' },
      { value: 'boleto', label: 'Boleto' },
      { value: 'cheque', label: 'Cheque' },
    ],
    []
  );

  return (
    <PageShell>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Contas a Pagar"
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por descrição, documento ou categoria..."
              actionButton={{
                label: 'Nova Conta a Pagar',
                onClick: () => toast.info('Funcionalidade de criação em desenvolvimento'),
              }}
              filtersSlot={
                <>
                  {/* Filtros primários (4) */}
                  <FilterPopover
                    label="Status"
                    options={statusOptions}
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val === 'all' ? '' : (val as StatusLancamento | ''));
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Vencimento"
                    options={vencimentoOptions}
                    value={vencimento}
                    onValueChange={(val) => {
                      setVencimento(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Categoria"
                    options={categoriaOptions}
                    value={categoria}
                    onValueChange={(val) => {
                      setCategoria(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FiltroFornecedor
                    value={fornecedorId}
                    onChange={(value) => {
                      setFornecedorId(value);
                      setPageIndex(0);
                    }}
                    placeholder="Fornecedor"
                    className="h-9 w-40 border-dashed bg-card"
                  />

                  {/* Filtros avançados (dropdown) */}
                  <MaisFiltrosPopover
                    tipoRecorrente={tipoRecorrente}
                    onTipoRecorrenteChange={(val) => {
                      setTipoRecorrente(val);
                      setPageIndex(0);
                    }}
                    tipoRecorrenteOptions={tipoRecorrenteOptions}
                    formaPagamento={formaPagamento}
                    onFormaPagamentoChange={(val) => {
                      setFormaPagamento(val);
                      setPageIndex(0);
                    }}
                    formaPagamentoOptions={formaPagamentoOptions}
                    contaContabilId={contaContabilId}
                    onContaContabilIdChange={(val) => {
                      setContaContabilId(val);
                      setPageIndex(0);
                    }}
                    tiposContaContabil={['despesa']}
                    centroCustoId={centroCustoId}
                    onCentroCustoIdChange={(val) => {
                      setCentroCustoId(val);
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
          paginacao && paginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={paginacao.pagina - 1}
              pageSize={paginacao.limite}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={contasPagar}
          columns={colunas}
          pagination={
            paginacao
              ? {
                  pageIndex: paginacao.pagina - 1,
                  pageSize: paginacao.limite,
                  total: paginacao.total,
                  totalPages: paginacao.totalPaginas,
                  onPageChange: setPageIndex,
                  onPageSizeChange: setPageSize,
                }
              : undefined
          }
          sorting={undefined}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Lancamento>)}
          emptyMessage="Nenhuma conta a pagar encontrada."
          hidePagination={true}
        />
      </DataShell>

      {/* Dialog de Pagamento */}
      {selectedConta && (
        <PagarContaDialog
          open={pagarDialogOpen}
          onOpenChange={setPagarDialogOpen}
          conta={selectedConta}
          contasBancarias={contasBancarias}
          onSuccess={refetch}
        />
      )}

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Pagar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta conta?
              {selectedConta && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedConta.descricao} - {formatarValor(selectedConta.valor)}
                </span>
              )}
              <span className="block mt-2 text-orange-600">
                A conta será marcada como cancelada mas permanecerá no histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelar}>Cancelar Conta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta a Pagar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente esta conta?
              {selectedConta && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedConta.descricao} - {formatarValor(selectedConta.valor)}
                </span>
              )}
              <span className="block mt-2 text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
