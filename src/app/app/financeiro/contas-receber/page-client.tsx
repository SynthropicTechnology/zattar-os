'use client';

/**
 * Página de Contas a Receber
 * Lista e gerencia contas a receber do escritório
 *
 * Seguindo o padrão DataShell usado em contratos e partes
 */

import * as React from 'react';
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
import { PageShell } from '@/components/shared/page-shell';
import {
  AlertasInadimplencia,
  cancelarContaReceber,
  ContaReceberFormDialog,
  type ContaReceberComDetalhes,
  excluirContaReceber,
  MaisFiltrosReceberPopover,
  type OrigemLancamento,
  ReceberContaDialog,
  type StatusContaReceber,
  useCentrosCustoAtivos,
  useContasBancarias,
  useContasReceber,
  usePlanoContasAnaliticas,
} from '@/features/financeiro';
import { FilterPopover } from '@/app/app/partes';
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
  FileText,
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

import { useClientes } from '@/app/app/partes';
import { useContratos } from '@/features/contratos';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const STATUS_CONFIG: Record<StatusContaReceber, { label: string; tone: BadgeVariant }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  confirmado: { label: 'Recebido', tone: 'success' },
  pago: { label: 'Pago', tone: 'success' },
  recebido: { label: 'Recebido', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'secondary' },
  estornado: { label: 'Estornado', tone: 'destructive' },
};

const CATEGORIAS = [
  { value: 'honorarios', label: 'Honorários' },
  { value: 'exito', label: 'Êxito' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'assessoria', label: 'Assessoria' },
  { value: 'outros', label: 'Outros' },
];

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

const isVencida = (conta: ContaReceberComDetalhes): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(conta.dataVencimento) < hoje;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function ContasReceberActions({
  conta,
  onReceber,
  onEditar,
  onCancelar,
  onExcluir,
  onVerDetalhes,
}: {
  conta: ContaReceberComDetalhes;
  onReceber: (conta: ContaReceberComDetalhes) => void;
  onEditar: (conta: ContaReceberComDetalhes) => void;
  onCancelar: (conta: ContaReceberComDetalhes) => void;
  onExcluir: (conta: ContaReceberComDetalhes) => void;
  onVerDetalhes: (conta: ContaReceberComDetalhes) => void;
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
            <DropdownMenuItem onClick={() => onReceber(conta)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Receber
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
  onReceber: (conta: ContaReceberComDetalhes) => void,
  onEditar: (conta: ContaReceberComDetalhes) => void,
  onCancelar: (conta: ContaReceberComDetalhes) => void,
  onExcluir: (conta: ContaReceberComDetalhes) => void,
  onVerDetalhes: (conta: ContaReceberComDetalhes) => void
): ColumnDef<ContaReceberComDetalhes>[] {
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
              {conta.recorrente && (
                <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recorrente" />
              )}
            </div>
            {conta.cliente && (
              <span className="text-xs text-muted-foreground">
                {conta.cliente.nomeFantasia || conta.cliente.razaoSocial}
              </span>
            )}
            {conta.contrato && (
              <span className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {conta.contrato.numero}
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
      size: 150,
      cell: ({ row }) => {
        const categoria = row.getValue('categoria') as string | null;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {categoria ? (
              <Badge variant="outline" className="capitalize text-xs">
                {categoria.replace(/_/g, ' ')}
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
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium text-green-600">
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
        const status = row.getValue('status') as StatusContaReceber;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={config.tone}>
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
            <ContasReceberActions
              conta={conta}
              onReceber={onReceber}
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

export default function ContasReceberPage() {
  // Estado da tabela
  const [table, setTable] = React.useState<TanstackTable<ContaReceberComDetalhes> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de filtros e busca
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [status, setStatus] = React.useState<StatusContaReceber | ''>('pendente');
  const [vencimento, setVencimento] = React.useState<string>('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [tipoRecorrente, setTipoRecorrente] = React.useState<string>('');
  const [origem, setOrigem] = React.useState<OrigemLancamento | ''>('');
  const [contaContabilId, setContaContabilId] = React.useState<string>('');
  const [centroCustoId, setCentroCustoId] = React.useState<string>('');

  // Estados de dialogs
  const [receberDialogOpen, setReceberDialogOpen] = React.useState(false);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<ContaReceberComDetalhes | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Router para navegação
  const router = useRouter();

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
      origem: origem || undefined,
      contaContabilId: contaContabilId ? Number(contaContabilId) : undefined,
      centroCustoId: centroCustoId ? Number(centroCustoId) : undefined,
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
    origem,
    contaContabilId,
    centroCustoId,
  ]);

  // Hook de dados
  const { contasReceber, paginacao, resumoInadimplencia, isLoading, error, refetch } = useContasReceber(params);

  // Dados auxiliares para os formulários
  const { contasBancarias } = useContasBancarias();
  const { clientes } = useClientes({ limite: 500, ativo: true });
  const { contratos } = useContratos({ limite: 500 });
  const { planoContas } = usePlanoContasAnaliticas();
  const { centrosCusto } = useCentrosCustoAtivos();

  // Handlers
  const handleReceber = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setReceberDialogOpen(true);
  }, []);

  const handleEditar = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setFormDialogOpen(true);
  }, []);

  const handleNovaConta = React.useCallback(() => {
    setSelectedConta(null);
    setFormDialogOpen(true);
  }, []);

  const handleCancelar = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setCancelarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerDetalhes = React.useCallback((conta: ContaReceberComDetalhes) => {
    router.push(`/financeiro/contas-receber/${conta.id}`);
  }, [router]);

  const handleConfirmCancelar = React.useCallback(async () => {
    if (!selectedConta) return;

    try {
      await cancelarContaReceber(selectedConta.id);
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
      await excluirContaReceber(selectedConta.id);
      toast.success('Conta excluída com sucesso');
      setExcluirDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir conta';
      toast.error(message);
    }
  }, [selectedConta, refetch]);

  // Handlers para alertas
  const handleFiltrarVencidas = React.useCallback(() => {
    setStatus('pendente');
    setVencimento('vencidas');
    setPageIndex(0);
  }, []);

  const handleFiltrarHoje = React.useCallback(() => {
    setStatus('pendente');
    setVencimento('hoje');
    setPageIndex(0);
  }, []);

  const handleFiltrar7Dias = React.useCallback(() => {
    setStatus('pendente');
    setVencimento('7dias');
    setPageIndex(0);
  }, []);

  const handleFiltrar30Dias = React.useCallback(() => {
    setStatus('pendente');
    setVencimento('30dias');
    setPageIndex(0);
  }, []);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(handleReceber, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes),
    [handleReceber, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes]
  );

  return (
    <PageShell>
      {/* Alertas de Inadimplência */}
      <AlertasInadimplencia
        resumo={resumoInadimplencia ?? null}
        isLoading={isLoading}
        onFiltrarVencidas={handleFiltrarVencidas}
        onFiltrarHoje={handleFiltrarHoje}
        onFiltrar7Dias={handleFiltrar7Dias}
        onFiltrar30Dias={handleFiltrar30Dias}
      />

      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Contas a Receber"
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por descrição, cliente ou contrato..."
              actionButton={{
                label: 'Nova Conta a Receber',
                onClick: handleNovaConta,
              }}
              filtersSlot={
                <>
                  {/* Filtros primários (3) */}
                  <FilterPopover
                    label="Status"
                    options={[
                      { value: 'pendente', label: 'Pendente' },
                      { value: 'confirmado', label: 'Recebido' },
                      { value: 'cancelado', label: 'Cancelado' },
                      { value: 'estornado', label: 'Estornado' },
                    ]}
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val === 'all' ? '' : (val as StatusContaReceber | ''));
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Vencimento"
                    options={[
                      { value: 'vencidas', label: 'Vencidas' },
                      { value: 'hoje', label: 'Vencem hoje' },
                      { value: '7dias', label: 'Próximos 7 dias' },
                      { value: '30dias', label: 'Próximos 30 dias' },
                    ]}
                    value={vencimento}
                    onValueChange={(val) => {
                      setVencimento(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Categoria"
                    options={CATEGORIAS}
                    value={categoria}
                    onValueChange={(val) => {
                      setCategoria(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />

                  {/* Filtros avançados (dropdown) */}
                  <MaisFiltrosReceberPopover
                    tipoRecorrente={tipoRecorrente}
                    onTipoRecorrenteChange={(val) => {
                      setTipoRecorrente(val);
                      setPageIndex(0);
                    }}
                    tipoRecorrenteOptions={[
                      { value: 'recorrente', label: 'Recorrentes' },
                      { value: 'avulsa', label: 'Avulsas' },
                    ]}
                    origem={origem}
                    onOrigemChange={(val) => {
                      setOrigem(val as OrigemLancamento | '');
                      setPageIndex(0);
                    }}
                    origemOptions={[
                      { value: 'manual', label: 'Manual' },
                      { value: 'acordo_judicial', label: 'Acordo Judicial' },
                      { value: 'contrato', label: 'Contrato' },
                    ]}
                    contaContabilId={contaContabilId}
                    onContaContabilIdChange={(val) => {
                      setContaContabilId(val);
                      setPageIndex(0);
                    }}
                    tiposContaContabil={['receita']}
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
          data={contasReceber}
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
          onTableReady={(t) => setTable(t as TanstackTable<ContaReceberComDetalhes>)}
          emptyMessage="Nenhuma conta a receber encontrada."
          hidePagination={true}
        />
      </DataShell>

      {/* Dialog de Recebimento */}
      <ReceberContaDialog
        open={receberDialogOpen}
        onOpenChange={setReceberDialogOpen}
        conta={selectedConta}
        contasBancarias={contasBancarias}
        onSuccess={refetch}
      />

      {/* Dialog de Criação/Edição */}
      <ContaReceberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        conta={selectedConta}
        contasBancarias={contasBancarias}
        planosContas={planoContas}
        centrosCusto={centrosCusto}
        clientes={clientes.map((cliente) => ({
          id: cliente.id,
          razaoSocial: cliente.nome || '',
          nomeFantasia: cliente.nome_social_fantasia || undefined,
        }))}
        contratos={contratos}
        onSuccess={refetch}
      />

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Receber</AlertDialogTitle>
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
            <AlertDialogTitle>Excluir Conta a Receber</AlertDialogTitle>
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
