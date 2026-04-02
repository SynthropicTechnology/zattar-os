'use client';

/**
 * PEÇAS JURÍDICAS FEATURE - PecasModelosTableWrapper
 *
 * Componente Client que encapsula a tabela de modelos de peças.
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação client-side com refresh via Server Actions
 * - Navegação para páginas de criação e edição
 * - Sheet de visualização
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
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
import { toast } from 'sonner';
import type { ColumnDef, Table as TanstackTable, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  actionListarPecasModelos,
  actionDeletarPecaModelo,
} from '../actions';
import {
  TIPO_PECA_LABELS,
  type PecaModeloListItem,
  type TipoPecaJuridica,
  type VisibilidadeModelo,
} from '../domain';
import { PecaModeloViewSheet } from './peca-modelo-view-sheet';

// =============================================================================
// TIPOS
// =============================================================================

interface PecasModelosTableWrapperProps {
  initialData: PecaModeloListItem[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
}

// =============================================================================
// COLUNAS
// =============================================================================

function getPecasModelosColumns(
  onView: (modelo: PecaModeloListItem) => void,
  onEdit: (modelo: PecaModeloListItem) => void,
  onDelete: (modelo: PecaModeloListItem) => void
): ColumnDef<PecaModeloListItem>[] {
  return [
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => {
        const modelo = row.original;
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{modelo.titulo}</p>
              {modelo.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {modelo.descricao}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoPeca',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipoPeca;
        return (
          <AppBadge variant="secondary">
            {TIPO_PECA_LABELS[tipo] || tipo}
          </AppBadge>
        );
      },
    },
    {
      accessorKey: 'visibilidade',
      header: 'Visibilidade',
      cell: ({ row }) => {
        const vis = row.original.visibilidade;
        return (
          <AppBadge variant={vis === 'publico' ? 'default' : 'outline'}>
            {vis === 'publico' ? 'Público' : 'Privado'}
          </AppBadge>
        );
      },
    },
    {
      accessorKey: 'usoCount',
      header: 'Usos',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.usoCount}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const modelo = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(modelo)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(modelo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(modelo)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(modelo)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(modelo)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PecasModelosTableWrapper({
  initialData,
  initialPagination,
}: PecasModelosTableWrapperProps) {

  // ---------- Estado dos Dados ----------
  const [modelos, setModelos] = React.useState<PecaModeloListItem[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<PecaModeloListItem> | undefined>(undefined);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 20
  );
  const [total, setTotal] = React.useState(
    initialPagination ? initialPagination.total : 0
  );
  const [totalPages, setTotalPages] = React.useState(
    initialPagination ? initialPagination.totalPages : 0
  );

  // ---------- Estado de Loading ----------
  const [isLoading, setIsLoading] = React.useState(false);

  // ---------- Estado de Filtros ----------
  const [busca, setBusca] = React.useState('');
  const [tipoPeca, setTipoPeca] = React.useState<string>('');
  const [visibilidade, setVisibilidade] = React.useState<string>('');
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // ---------- Router ----------
  const router = useRouter();

  // ---------- Estado de Dialogs/Sheets ----------
  const [viewOpen, setViewOpen] = React.useState(false);
  const [modeloSelecionado, setModeloSelecionado] = React.useState<PecaModeloListItem | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [modeloToDelete, setModeloToDelete] = React.useState<PecaModeloListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Ref para evitar fetch inicial duplicado ----------
  const isFirstRender = React.useRef(true);

  // ---------- Colunas ----------
  const columns = React.useMemo(
    () =>
      getPecasModelosColumns(
        (modelo) => {
          setModeloSelecionado(modelo);
          setViewOpen(true);
        },
        (modelo) => {
          router.push(`/app/pecas-juridicas/${modelo.id}/editar`);
        },
        (modelo) => {
          setModeloToDelete(modelo);
          setDeleteDialogOpen(true);
        }
      ),
    [router]
  );

  // ---------- Fetch de Dados ----------
  const fetchModelos = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await actionListarPecasModelos({
        search: buscaDebounced || undefined,
        tipoPeca: tipoPeca ? (tipoPeca as TipoPecaJuridica) : undefined,
        visibilidade: visibilidade ? (visibilidade as VisibilidadeModelo) : undefined,
        apenasAtivos: true,
        page: pageIndex + 1,
        pageSize,
        orderBy: sorting[0]?.id as 'titulo' | 'created_at' | 'uso_count' | undefined,
        orderDirection: sorting[0]?.desc ? 'desc' : 'asc',
      });

      if (result.success) {
        setModelos(result.data.data);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error('Erro ao carregar modelos', { description: result.message });
      }
    } finally {
      setIsLoading(false);
    }
  }, [buscaDebounced, tipoPeca, visibilidade, pageIndex, pageSize, sorting]);

  // Refetch quando filtros mudam
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchModelos();
  }, [fetchModelos]);

  // ---------- Handlers ----------
  const handleCreate = () => {
    router.push('/app/pecas-juridicas/novo');
  };

  const handleConfirmDelete = async () => {
    if (!modeloToDelete) return;

    setDeleting(true);
    try {
      const result = await actionDeletarPecaModelo(modeloToDelete.id);

      if (result.success) {
        toast.success('Modelo excluído com sucesso');
        fetchModelos();
      } else {
        toast.error('Erro ao excluir modelo', { description: result.message });
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setModeloToDelete(null);
    }
  };

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Modelos de Peças"
            searchValue={busca}
            onSearchValueChange={setBusca}
            searchPlaceholder="Buscar modelos..."
            density={density}
            onDensityChange={setDensity}
            table={table}
            actionButton={{
              label: 'Novo Modelo',
              onClick: handleCreate,
            }}
            filtersSlot={
              <>
                {/* Filtro por Tipo de Peça */}
                <Select value={tipoPeca || 'all'} onValueChange={(val) => setTipoPeca(val === 'all' ? '' : val)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo de Peça" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {Object.entries(TIPO_PECA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por Visibilidade */}
                <Select value={visibilidade || 'all'} onValueChange={(val) => setVisibilidade(val === 'all' ? '' : val)}>
                  <SelectTrigger className="w-35">
                    <SelectValue placeholder="Visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
        }
        footer={
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            isLoading={isLoading}
          />
        }
        scrollableContent
      >
        <DataTable
          columns={columns}
          data={modelos}
          density={density}
          sorting={sorting}
          onSortingChange={setSorting}
          onTableReady={(t) => setTable(t || undefined)}
          isLoading={isLoading}
          emptyMessage="Nenhum modelo encontrado"
          emptyComponent={
            <div className="flex flex-col items-center gap-2 py-8">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <span className="text-muted-foreground">Nenhum modelo encontrado</span>
            </div>
          }
        />
      </DataShell>

      {/* View Sheet */}
      <PecaModeloViewSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        modelo={modeloSelecionado}
        onEdit={(modelo) => {
          setViewOpen(false);
          router.push(`/app/pecas-juridicas/${modelo.id}/editar`);
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo &ldquo;{modeloToDelete?.titulo}&rdquo;?
              Esta ação não pode ser desfeita. Documentos já gerados não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
