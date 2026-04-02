
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { SalarioFormDialog } from './salario-form-dialog';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import {
  Pencil,
  History,
  XCircle,
  Trash2,
  CalendarOff,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useSalarios,
  encerrarVigenciaSalario,
  inativarSalario,
  excluirSalario,
} from '../../hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import type { SalarioComDetalhes } from '../../types';


// ============================================================================
// Constantes e Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  const date = new Date(data);
  // Adjust for timezone if needed, or assume UTC date string
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

const isVigente = (salario: SalarioComDetalhes): boolean => {
  if (!salario.ativo) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(salario.dataInicioVigencia);
  inicio.setHours(0, 0, 0, 0);
  if (inicio > hoje) return false;
  if (salario.dataFimVigencia) {
    const fim = new Date(salario.dataFimVigencia);
    fim.setHours(0, 0, 0, 0);
    return fim >= hoje;
  }
  return true;
};

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onEditar: (salario: SalarioComDetalhes) => void,
  onEncerrarVigencia: (salario: SalarioComDetalhes) => void,
  onInativar: (salario: SalarioComDetalhes) => void,
  onExcluir: (salario: SalarioComDetalhes) => void,
  onVerHistorico: (salario: SalarioComDetalhes) => void
): ColumnDef<SalarioComDetalhes>[] {
  return [
    {
      accessorKey: 'usuario',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Funcionário" />,
      enableSorting: true,
      size: 250,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const salario = row.original;
        return (
          <div className="flex min-h-10 flex-col justify-center">
            <span className="text-sm font-medium leading-tight">
              {salario.usuario?.nomeExibicao || `Usuário ${salario.usuarioId}`}
            </span>
            {salario.cargo && (
              <span className="text-xs leading-tight text-muted-foreground">
                {salario.cargo.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'salarioBruto',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Salário Bruto" className="justify-end" />
      ),
      enableSorting: true,
      size: 150,
      meta: { align: 'right' as const },
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {formatarValor(row.original.salarioBruto)}
        </span>
      ),
    },
    {
      accessorKey: 'dataInicioVigencia',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Início" />
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left' as const },
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatarData(row.original.dataInicioVigencia)}
        </span>
      ),
    },
    {
      accessorKey: 'dataFimVigencia',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fim" />
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const salario = row.original;
        const vigente = isVigente(salario);
        return salario.dataFimVigencia ? (
          <span className="text-sm tabular-nums">{formatarData(salario.dataFimVigencia)}</span>
        ) : vigente ? (
          <Badge variant={getSemanticBadgeVariant('salario_status', 'VIGENTE')}>
            Vigente
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const salario = row.original;
        const vigente = isVigente(salario);
        return salario.ativo ? (
          vigente ? (
            <Badge variant={getSemanticBadgeVariant('salario_status', 'ATIVO')}>Ativo</Badge>
          ) : (
            <Badge variant={getSemanticBadgeVariant('salario_status', 'ENCERRADO')}>Encerrado</Badge>
          )
        ) : (
          <Badge variant={getSemanticBadgeVariant('salario_status', 'INATIVO')}>Inativo</Badge>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center">
          <span className="text-sm font-medium text-muted-foreground">Ações</span>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 140,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const salario = row.original;
        const vigente = isVigente(salario);
        return (
          <div className="flex items-center gap-1">
            {salario.ativo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditar(salario)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onVerHistorico(salario)}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver Histórico</TooltipContent>
            </Tooltip>
            {salario.ativo && vigente && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-600 hover:text-orange-600"
                    onClick={() => onEncerrarVigencia(salario)}
                  >
                    <CalendarOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encerrar Vigência</TooltipContent>
              </Tooltip>
            )}
            {salario.ativo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-600 hover:text-orange-600"
                    onClick={() => onInativar(salario)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Inativar</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onExcluir(salario)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export function SalariosList() {
  const router = useRouter();

  // Estado da instância da tabela e densidade
  const [table, setTable] = React.useState<
    TanstackTable<SalarioComDetalhes> | undefined
  >(undefined);
  const [density, setDensity] = React.useState<
    'compact' | 'standard' | 'relaxed'
  >('standard');

  // Estados de filtros
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(1);

  const buscaDebounced = useDebounce(busca, 500);

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [salarioParaEditar, setSalarioParaEditar] =
    React.useState<SalarioComDetalhes | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false);
  const [acao, setAcao] = React.useState<'inativar' | 'excluir' | null>(null);
  const [salarioSelecionado, setSalarioSelecionado] =
    React.useState<SalarioComDetalhes | null>(null);
  const [encerrarDialogOpen, setEncerrarDialogOpen] = React.useState(false);
  const [dataFimVigencia, setDataFimVigencia] = React.useState('');

  // Hook de busca
  const { salarios, paginacao, totais, isLoading, error, refetch } = useSalarios({
    pagina,
    limite: 50,
    busca: buscaDebounced || undefined,
    ordenarPor: 'data_inicio_vigencia',
    ordem: 'desc',
    incluirTotais: true,
  });

  // Handlers
  const handleEditar = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioParaEditar(salario);
    setFormDialogOpen(true);
  }, []);

  const handleNovo = React.useCallback(() => {
    setSalarioParaEditar(null);
    setFormDialogOpen(true);
  }, []);

  const handleEncerrarVigencia = React.useCallback(
    (salario: SalarioComDetalhes) => {
      setSalarioSelecionado(salario);
      setDataFimVigencia(format(new Date(), 'yyyy-MM-dd'));
      setEncerrarDialogOpen(true);
    },
    []
  );

  const handleConfirmarEncerramento = React.useCallback(async () => {
    if (!salarioSelecionado || !dataFimVigencia) return;

    const result = await encerrarVigenciaSalario(
      salarioSelecionado.id,
      dataFimVigencia
    );

    if (result.success) {
      toast.success('Vigência encerrada com sucesso');
      setEncerrarDialogOpen(false);
      setSalarioSelecionado(null);
      refetch();
    } else {
      toast.error(result.error || 'Erro ao encerrar vigência');
    }
  }, [salarioSelecionado, dataFimVigencia, refetch]);

  const handleInativar = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioSelecionado(salario);
    setAcao('inativar');
    setAlertDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioSelecionado(salario);
    setAcao('excluir');
    setAlertDialogOpen(true);
  }, []);

  const handleConfirmarAcao = React.useCallback(async () => {
    if (!salarioSelecionado || !acao) return;

    let result;
    if (acao === 'inativar') {
      result = await inativarSalario(salarioSelecionado.id);
    } else {
      result = await excluirSalario(salarioSelecionado.id);
    }

    if (result.success) {
      toast.success(
        acao === 'inativar' ? 'Salário inativado' : 'Salário excluído'
      );
      setAlertDialogOpen(false);
      setSalarioSelecionado(null);
      setAcao(null);
      refetch();
    } else {
      toast.error(result.error || `Erro ao ${acao} salário`);
    }
  }, [salarioSelecionado, acao, refetch]);

  const handleVerHistorico = React.useCallback(
    (salario: SalarioComDetalhes) => {
      router.push(`/rh/salarios/usuario/${salario.usuarioId}`);
    },
    [router]
  );

  const handleFormSuccess = React.useCallback(() => {
    setFormDialogOpen(false);
    setSalarioParaEditar(null);
    refetch();
  }, [refetch]);

  // Colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(
        handleEditar,
        handleEncerrarVigencia,
        handleInativar,
        handleExcluir,
        handleVerHistorico
      ),
    [
      handleEditar,
      handleEncerrarVigencia,
      handleInativar,
      handleExcluir,
      handleVerHistorico,
    ]
  );

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            table={table}
            title="Salários"
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={setBusca}
            searchPlaceholder="Buscar por funcionário ou observações..."
            actionButton={{
              label: 'Novo Salário',
              onClick: handleNovo,
            }}
          />
        }
        subHeader={
          totais ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card: Total Funcionários */}
              <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md">
                <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="relative space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Funcionários com Salário
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{totais.totalFuncionarios}</p>
                </div>
              </div>

              {/* Card: Custo Mensal */}
              <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50/50 to-card dark:from-emerald-950/20 dark:to-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="relative space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Custo Mensal Bruto
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
                    {formatarValor(totais.totalBrutoMensal)}
                  </p>
                </div>
              </div>
            </div>
          ) : null
        }
        footer={
          paginacao && paginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={pagina - 1}
              pageSize={50}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={(pageIndex) => setPagina(pageIndex + 1)}
              onPageSizeChange={() => { }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          columns={colunas}
          data={salarios}
          isLoading={isLoading}
          error={error}
          pagination={
            paginacao
              ? {
                pageIndex: pagina - 1,
                pageSize: 50,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: (pageIndex) => setPagina(pageIndex + 1),
                onPageSizeChange: () => { },
              }
              : undefined
          }
          hidePagination={true}
          onTableReady={setTable}
          density={density}
          emptyMessage="Nenhum salário encontrado."
        />
      </DataShell>

      {/* Dialog de Formulário */}
      <SalarioFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        salario={salarioParaEditar}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog de Encerramento de Vigência */}
      <Dialog open={encerrarDialogOpen} onOpenChange={setEncerrarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Vigência</DialogTitle>
            <DialogDescription>
              Informe a data de fim da vigência para o salário de{' '}
              <strong>{salarioSelecionado?.usuario?.nomeExibicao}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dataFimVigencia">Data de Fim</Label>
            <Input
              id="dataFimVigencia"
              type="date"
              value={dataFimVigencia}
              onChange={(e) => setDataFimVigencia(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEncerrarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarEncerramento}
              disabled={!dataFimVigencia}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acao === 'inativar' ? 'Inativar Salário' : 'Excluir Salário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acao === 'inativar'
                ? `Tem certeza que deseja inativar o salário de ${salarioSelecionado?.usuario?.nomeExibicao}? O registro será mantido para histórico.`
                : `Tem certeza que deseja excluir o salário de ${salarioSelecionado?.usuario?.nomeExibicao}? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarAcao}
              className={
                acao === 'excluir'
                  ? 'bg-destructive text-destructive-foreground'
                  : ''
              }
            >
              {acao === 'inativar' ? 'Inativar' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
