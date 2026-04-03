'use client';

/**
 * Página de Orçamentos
 * Lista e gerencia orçamentos empresariais
 *
 * REFATORADO: Migrado de TableToolbar (deprecated) para DataTableToolbar (Data Shell)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import {
  aprovarOrcamento,
  encerrarOrcamento,
  exportarOrcamentoCSV,
  exportarRelatorioPDF,
  excluirOrcamento,
  iniciarExecucaoOrcamento,
  isPeriodoValido,
  isStatusValido,
  OrcamentoFormDialog,
  type OrcamentoComItens,
  type PeriodoOrcamento,
  type StatusOrcamento,
  useOrcamentos,
} from '@/app/(authenticated)/financeiro';
import { PageShell } from '@/components/shared/page-shell';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle2,
  PlayCircle,
  Archive,
  Trash2,
  BarChart3,
  FileDown,
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
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; tone: BadgeVariant }> = {
  rascunho: { label: 'Rascunho', tone: 'secondary' },
  aprovado: { label: 'Aprovado', tone: 'default' },
  em_execucao: { label: 'Em Execução', tone: 'success' },
  encerrado: { label: 'Encerrado', tone: 'outline' },
  cancelado: { label: 'Cancelado', tone: 'destructive' },
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

const calcularTotalOrcado = (orcamento: OrcamentoComItens): number => {
  return orcamento.itens?.reduce((sum, item) => sum + item.valorPrevisto, 0) || 0;
};

// Função para gerar lista de anos (últimos 5 anos + próximos 2)
const gerarAnosDisponiveis = (): number[] => {
  const anoAtual = new Date().getFullYear();
  const anos: number[] = [];
  for (let i = -5; i <= 2; i++) {
    anos.push(anoAtual + i);
  }
  return anos.sort((a, b) => b - a); // Decrescente
};

// ============================================================================
// Componente de Ações
// ============================================================================

function OrcamentosActions({
  orcamento,
  onVerDetalhes,
  onEditar,
  onAprovar,
  onIniciarExecucao,
  onEncerrar,
  onExcluir,
  onVerAnalise,
  onExportar,
}: {
  orcamento: OrcamentoComItens;
  onVerDetalhes: (orc: OrcamentoComItens) => void;
  onEditar: (orc: OrcamentoComItens) => void;
  onAprovar: (orc: OrcamentoComItens) => void;
  onIniciarExecucao: (orc: OrcamentoComItens) => void;
  onEncerrar: (orc: OrcamentoComItens) => void;
  onExcluir: (orc: OrcamentoComItens) => void;
  onVerAnalise: (orc: OrcamentoComItens) => void;
  onExportar: (orc: OrcamentoComItens) => void;
}) {
  const isRascunho = orcamento.status === 'rascunho';
  const isAprovado = orcamento.status === 'aprovado';
  const isEmExecucao = orcamento.status === 'em_execucao';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do orçamento</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(orcamento)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {(isEmExecucao || orcamento.status === 'encerrado') && (
          <DropdownMenuItem onClick={() => onVerAnalise(orcamento)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver Análise
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onExportar(orcamento)}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar
        </DropdownMenuItem>
        {isRascunho && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditar(orcamento)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAprovar(orcamento)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExcluir(orcamento)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
        {isAprovado && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onIniciarExecucao(orcamento)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Iniciar Execução
            </DropdownMenuItem>
          </>
        )}
        {isEmExecucao && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEncerrar(orcamento)}>
              <Archive className="mr-2 h-4 w-4" />
              Encerrar
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
  onVerDetalhes: (orc: OrcamentoComItens) => void,
  onEditar: (orc: OrcamentoComItens) => void,
  onAprovar: (orc: OrcamentoComItens) => void,
  onIniciarExecucao: (orc: OrcamentoComItens) => void,
  onEncerrar: (orc: OrcamentoComItens) => void,
  onExcluir: (orc: OrcamentoComItens) => void,
  onVerAnalise: (orc: OrcamentoComItens) => void,
  onExportar: (orc: OrcamentoComItens) => void
): ColumnDef<OrcamentoComItens>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' as const, headerLabel: 'Nome' },
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium">{orcamento.nome}</span>
            {orcamento.descricao && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {orcamento.descricao}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ano',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ano" />
      ),
      enableSorting: true,
      size: 80,
      meta: { align: 'left' as const, headerLabel: 'Ano' },
      cell: ({ row }) => {
        return (
          <div className="flex items-center font-medium">
            {row.getValue('ano')}
          </div>
        );
      },
    },
    {
      accessorKey: 'periodo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Período" />
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left' as const, headerLabel: 'Período' },
      cell: ({ row }) => {
        const periodo = row.getValue('periodo') as string;
        return (
          <div className="flex items-center">
            <Badge variant="outline">{PERIODO_LABELS[periodo] || periodo}</Badge>
          </div>
        );
      },
    },
    {
      id: 'dataVigencia',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vigência" />
      ),
      size: 180,
      meta: { align: 'left' as const, headerLabel: 'Vigência' },
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="flex items-center text-sm">
            {formatarData(orcamento.dataInicio)} - {formatarData(orcamento.dataFim)}
          </div>
        );
      },
    },
    {
      id: 'valorTotal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valor Total" />
      ),
      size: 130,
      meta: { align: 'left' as const, headerLabel: 'Valor Total' },
      cell: ({ row }) => {
        const total = calcularTotalOrcado(row.original);
        return (
          <div className="flex items-center font-mono text-sm font-medium">
            {formatarValor(total)}
          </div>
        );
      },
    },
    {
      id: 'itens',
      header: () => (
        <div className="text-sm font-medium">Itens</div>
      ),
      size: 70,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const qtdItens = row.original.itens?.length || 0;
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="font-mono">
              {qtdItens}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left' as const, headerLabel: 'Status' },
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusOrcamento;
        const config = STATUS_CONFIG[status];
        return (
          <div className="flex items-center">
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
        <div className="text-sm font-medium">Ações</div>
      ),
      enableSorting: false,
      size: 80,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="flex items-center">
            <OrcamentosActions
              orcamento={orcamento}
              onVerDetalhes={onVerDetalhes}
              onEditar={onEditar}
              onAprovar={onAprovar}
              onIniciarExecucao={onIniciarExecucao}
              onEncerrar={onEncerrar}
              onExcluir={onExcluir}
              onVerAnalise={onVerAnalise}
              onExportar={onExportar}
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

interface OrcamentosClientPageProps {
  usuarioId: string;
}

export default function OrcamentosClientPage({ usuarioId }: OrcamentosClientPageProps) {
  const router = useRouter();

  // Estados de busca e paginação
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [status, setStatus] = React.useState<string>('');
  const [periodo, setPeriodo] = React.useState<PeriodoOrcamento | undefined>(undefined);
  const [ano, setAno] = React.useState<string>('');

  // Estados do Data Shell
  const [table, setTable] = React.useState<TanstackTable<OrcamentoComItens> | undefined>(undefined);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = React.useState<OrcamentoComItens | null>(null);
  const [aprovarDialogOpen, setAprovarDialogOpen] = React.useState(false);
  const [iniciarDialogOpen, setIniciarDialogOpen] = React.useState(false);
  const [encerrarDialogOpen, setEncerrarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(globalFilter, 500);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    return {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: buscaDebounced || undefined,
      status: (status && isStatusValido(status) ? status : undefined) as StatusOrcamento | StatusOrcamento[] | undefined,
      periodo: (periodo && isPeriodoValido(periodo) ? periodo : undefined) as PeriodoOrcamento | undefined,
      ano: ano ? Number(ano) : undefined,
    };
  }, [pageIndex, pageSize, buscaDebounced, status, periodo, ano]);

  // Hook de dados
  const { orcamentos, total, isLoading, error, refetch } = useOrcamentos({
    autoFetch: true,
    filters: params,
  });

  // Handlers de ações
  const handleVerDetalhes = React.useCallback(
    (orcamento: OrcamentoComItens) => {
      router.push(`/financeiro/orcamentos/${orcamento.id}`);
    },
    [router]
  );

  const handleEditar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setFormDialogOpen(true);
  }, []);

  const handleAprovar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setAprovarDialogOpen(true);
  }, []);

  const handleIniciarExecucao = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setIniciarDialogOpen(true);
  }, []);

  const handleEncerrar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setEncerrarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerAnalise = React.useCallback(
    (orcamento: OrcamentoComItens) => {
      router.push(`/financeiro/orcamentos/${orcamento.id}/analise`);
    },
    [router]
  );

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportar = React.useCallback(async (orcamento: OrcamentoComItens) => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Se orçamento está em execução ou encerrado, buscar relatório completo para exportar
      if (orcamento.status === 'em_execucao' || orcamento.status === 'encerrado') {
        toast.info('Gerando relatório PDF...');

        const response = await fetch(`/api/financeiro/orcamentos/${orcamento.id}/relatorio?formato=json`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || 'Erro ao buscar relatório');
        }

        const data = await response.json();
        if (!data.success || !data.data) {
          throw new Error('Não foi possível gerar o relatório');
        }

        // Converter estrutura da API para formato esperado pelo exportador
        const relatorio = {
          orcamento: data.data.orcamento,
          analise: data.data.analise,
          resumo: data.data.analise?.resumo || null,
          alertas: data.data.analise?.alertas || [],
          evolucao: data.data.analise?.evolucao || [],
          projecao: null,
          geradoEm: data.data.geradoEm,
        };

        await exportarRelatorioPDF(relatorio);
        toast.success('Relatório PDF exportado com sucesso');
      } else {
        // Para orçamentos em rascunho ou aprovados, exportar apenas dados básicos
        exportarOrcamentoCSV(orcamento);
        toast.success('Orçamento exportado para CSV');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const handleNovo = React.useCallback(() => {
    setSelectedOrcamento(null);
    setFormDialogOpen(true);
  }, []);

  // Handlers de confirmação
  const handleConfirmAprovar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await aprovarOrcamento(selectedOrcamento.id);
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
  }, [selectedOrcamento, refetch]);

  const handleConfirmIniciar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await iniciarExecucaoOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Execução do orçamento iniciada com sucesso');
      setIniciarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao iniciar execução';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  const handleConfirmEncerrar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await encerrarOrcamento(selectedOrcamento.id);
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
  }, [selectedOrcamento, refetch]);

  const handleConfirmExcluir = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await excluirOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento excluído com sucesso');
      setExcluirDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir orçamento';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(
        handleVerDetalhes,
        handleEditar,
        handleAprovar,
        handleIniciarExecucao,
        handleEncerrar,
        handleExcluir,
        handleVerAnalise,
        handleExportar
      ),
    [
      handleVerDetalhes,
      handleEditar,
      handleAprovar,
      handleIniciarExecucao,
      handleEncerrar,
      handleExcluir,
      handleVerAnalise,
      handleExportar,
    ]
  );

  const anosDisponiveis = React.useMemo(() => gerarAnosDisponiveis(), []);

  // Opções de filtros
  const statusOptions = React.useMemo(
    () => [
      { value: 'rascunho', label: 'Rascunho' },
      { value: 'aprovado', label: 'Aprovado' },
      { value: 'em_execucao', label: 'Em Execução' },
      { value: 'encerrado', label: 'Encerrado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
    []
  );

  const periodoOptions = React.useMemo(
    () => [
      { value: 'mensal', label: 'Mensal' },
      { value: 'trimestral', label: 'Trimestral' },
      { value: 'semestral', label: 'Semestral' },
      { value: 'anual', label: 'Anual' },
    ],
    []
  );

  const anoOptions = React.useMemo(
    () => anosDisponiveis.map((a) => ({ value: String(a), label: String(a) })),
    [anosDisponiveis]
  );

  return (
    <PageShell>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Orçamentos"
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por nome ou descrição..."
              actionButton={{
                label: 'Novo Orçamento',
                onClick: handleNovo,
              }}
              filtersSlot={
                <>
                  <FilterPopover
                    label="Status"
                    options={statusOptions}
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Período"
                    options={periodoOptions}
                    value={periodo ?? ''}
                    onValueChange={(val) => {
                      if (val === 'all' || val === '') {
                        setPeriodo(undefined);
                      } else if (isPeriodoValido(val)) {
                        setPeriodo(val);
                      }
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                  <FilterPopover
                    label="Ano"
                    options={anoOptions}
                    value={ano}
                    onValueChange={(val) => {
                      setAno(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                    defaultValue=""
                  />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          total > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={orcamentos}
          columns={colunas}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          sorting={undefined}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<OrcamentoComItens>)}
          emptyMessage="Nenhum orçamento encontrado."
          hidePagination={true}
        />
      </DataShell>

      {/* Dialog de Formulário */}
      <OrcamentoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        orcamento={selectedOrcamento}
        usuarioId={usuarioId}
        onSuccess={refetch}
      />

      {/* Dialog de Aprovação */}
      <AlertDialog open={aprovarDialogOpen} onOpenChange={setAprovarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
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

      {/* Dialog de Iniciar Execução */}
      <AlertDialog open={iniciarDialogOpen} onOpenChange={setIniciarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Execução</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja iniciar a execução deste orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
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

      {/* Dialog de Encerramento */}
      <AlertDialog open={encerrarDialogOpen} onOpenChange={setEncerrarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
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

      {/* Dialog de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
              <span className="block mt-2 text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
