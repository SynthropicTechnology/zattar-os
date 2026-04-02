'use client';

/**
 * CallHistoryList - Componente de listagem do histórico de chamadas
 *
 * Segue o padrão DataShell do módulo de partes:
 * - DataShell com header (toolbar) e footer (pagination)
 * - DataTableToolbar com busca, filtros, densidade e exportação
 * - DataTable com callback onTableReady
 */

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import type { Table as TanstackTable } from '@tanstack/react-table';
import {
  ChamadaComParticipantes,
  ListarChamadasParams,
  PaginationInfo,
  TipoChamada,
  StatusChamada
} from '../domain';
import { actionListarHistoricoGlobal } from '../actions/chamadas-actions';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination
} from '@/components/shared/data-shell';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatarDuracao, getStatusBadgeVariant, getStatusLabel, getTipoChamadaIcon } from '../utils';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CallDetailSheet } from './call-detail-sheet';
import { Eye, FileText, Sparkles, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RecordingPlayer } from './recording-player';

// =============================================================================
// TIPOS
// =============================================================================

interface CallHistoryListProps {
  initialData: ChamadaComParticipantes[];
  initialPagination: PaginationInfo;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CallHistoryList({ initialData, initialPagination }: CallHistoryListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado da tabela e dados
  const [data, setData] = React.useState<ChamadaComParticipantes[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<ChamadaComParticipantes> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estado de paginação
  const [pageIndex, setPageIndex] = React.useState(initialPagination.currentPage - 1);
  const [pageSize, setPageSize] = React.useState(initialPagination.pageSize);
  const [total, setTotal] = React.useState(initialPagination.totalCount);
  const [totalPages, setTotalPages] = React.useState(initialPagination.totalPages);

  // Estado de loading e filtros
  const [isLoading, setIsLoading] = React.useState(false);
  const [tipoFilter, setTipoFilter] = React.useState<string>(searchParams?.get('tipo') || '');
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams?.get('status') || '');

  // Estado de modais
  const [selectedChamadaId, setSelectedChamadaId] = React.useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedRecording, setSelectedRecording] = React.useState<{
    url: string;
    chamadaId: number;
  } | null>(null);

  // Ref para controlar primeira renderização
  const isFirstRender = React.useRef(true);

  // Helper para criar query string
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Função para buscar dados
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ListarChamadasParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        tipo: tipoFilter ? (tipoFilter as TipoChamada) : undefined,
        status: statusFilter ? (statusFilter as StatusChamada) : undefined,
      };

      const result = await actionListarHistoricoGlobal(params);
      if (result.success) {
        setData(result.data.data);
        setTotal(result.data.pagination.totalCount);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, tipoFilter, statusFilter]);

  // Recarregar quando parâmetros mudam
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    fetchData();
  }, [pageIndex, pageSize, tipoFilter, statusFilter, fetchData]);

  // Handler de mudança de página
  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
    router.push(`${pathname}?${createQueryString({ page: newPageIndex + 1 })}`);
  };

  // Handler de mudança de pageSize
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
    router.push(`${pathname}?${createQueryString({ page: 1, limit: newPageSize })}`);
  };

  // Handler de mudança de filtro de tipo
  const handleTipoChange = (value: string) => {
    const newValue = value === 'all' ? '' : value;
    setTipoFilter(newValue);
    setPageIndex(0);
    router.push(`${pathname}?${createQueryString({ tipo: newValue || null, page: 1 })}`);
  };

  // Handler de mudança de filtro de status
  const handleStatusChange = (value: string) => {
    const newValue = value === 'all' ? '' : value;
    setStatusFilter(newValue);
    setPageIndex(0);
    router.push(`${pathname}?${createQueryString({ status: newValue || null, page: 1 })}`);
  };

  // Definição das colunas
  const columns: ColumnDef<ChamadaComParticipantes>[] = React.useMemo(() => [
    {
      accessorKey: 'iniciadaEm',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const date = new Date(row.original.iniciadaEm);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{format(date, 'dd/MM/yyyy', { locale: ptBR })}</span>
            <span className="text-xs text-muted-foreground">{format(date, 'HH:mm', { locale: ptBR })}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const Icon = getTipoChamadaIcon(row.original.tipo as TipoChamada);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{row.original.tipo}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'salaId',
      header: 'Sala',
      cell: ({ row }) => (
        <span>Sala #{row.original.salaId}</span>
      ),
    },
    {
      accessorKey: 'iniciador',
      header: 'Iniciador',
      cell: ({ row }) => {
        const user = row.original.iniciador;
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.nomeCompleto.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-37.5" title={user.nomeCompleto}>
              {user.nomeExibicao || user.nomeCompleto.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      header: 'Participantes',
      cell: ({ row }) => {
        const count = row.original.participantes.length;
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm">{count}</span>
            <span className="text-xs text-muted-foreground">participantes</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'duracaoSegundos',
      header: 'Duração',
      cell: ({ row }) => {
        const duracao = row.original.duracaoSegundos;
        const status = row.original.status as StatusChamada;

        if (status === StatusChamada.EmAndamento) {
          return <Badge variant={getSemanticBadgeVariant('call_status', 'em_andamento')} className="animate-pulse">Em andamento</Badge>;
        }

        return duracao ? formatarDuracao(duracao) : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status as StatusChamada)}>
          {getStatusLabel(row.original.status as StatusChamada)}
        </Badge>
      ),
    },
    {
      accessorKey: "gravacaoUrl",
      header: "Gravação",
      cell: ({ row }) => {
        const gravacaoUrl = row.original.gravacaoUrl;

        if (!gravacaoUrl) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRecording({
                url: gravacaoUrl,
                chamadaId: row.original.id,
              });
            }}
            className="h-8 w-8 p-0"
          >
            <Play className="h-4 w-4 text-primary" />
            <span className="sr-only">Assistir</span>
          </Button>
        );
      },
    },
    {
      id: 'features',
      header: 'IA',
      cell: ({ row }) => {
        const hasTranscript = !!row.original.transcricao;
        const hasSummary = !!row.original.resumo;

        if (!hasTranscript && !hasSummary) return <span className="text-muted-foreground text-xs">-</span>;

        return (
          <div className="flex items-center gap-1">
            {hasTranscript && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <FileText className="w-4 h-4 text-blue-600" />
                  </TooltipTrigger>
                  <TooltipContent>Transcrição disponível</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {hasSummary && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </TooltipTrigger>
                  <TooltipContent>Resumo IA gerado</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedChamadaId(row.original.id);
            setIsSheetOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Detalhes
        </Button>
      ),
    },
  ], []);

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchPlaceholder="Buscar chamadas..."
              filtersSlot={
                <>
                  <Select
                    value={tipoFilter || 'all'}
                    onValueChange={handleTipoChange}
                  >
                    <SelectTrigger className="w-full sm:w-37.5">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter || 'all'}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full sm:w-42.5">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="iniciada">Iniciada</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={data}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          isLoading={isLoading}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<ChamadaComParticipantes>)}
          emptyMessage="Nenhuma chamada encontrada."
        />
      </DataShell>

      <CallDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        chamadaId={selectedChamadaId}
      />

      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl">
          {selectedRecording && (
            <RecordingPlayer
              recordingUrl={selectedRecording.url}
              chamadaId={selectedRecording.chamadaId}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
