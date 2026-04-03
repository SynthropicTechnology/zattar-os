'use client';

/**
 * ProcessosTableWrapper - Componente Client que encapsula a tabela de processos
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginacao client-side com refresh via Server Actions
 * - Sheet de visualizacao de detalhes
 */

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { TablePagination } from '@/components/shared/table-pagination';
import { FilterPopover, FilterPopoverMulti, type FilterOption } from '@/app/(authenticated)/partes/components/shared';
import {
  GrauBadgesSimple,
  ProcessosEmptyState,
  ProcessoStatusBadge,
  ProximaAudienciaPopover,
  ProcessoTagsDialog,
  ProcessoForm,
} from '@/app/(authenticated)/processos/components';
import { actionListarProcessos } from '@/app/(authenticated)/processos/actions';
import { type Tag, actionListarTagsDosProcessos } from '@/lib/domain/tags';
import { TagBadgeList } from '@/components/ui/tag-badge';
import type {
  Processo,
  ProcessoUnificado,
} from '@/app/(authenticated)/processos/types';
import {
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
} from './processos-toolbar-filters';
import { GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { Eye, Lock, CheckCircle, XCircle, Link2, Settings, Search, Columns, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CopyButton } from '@/app/(authenticated)/partes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProcessosAlterarResponsavelDialog } from './processos-alterar-responsavel-dialog';
import { ProcessosBulkActions } from './processos-bulk-actions';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import { ConfigAtribuicaoDialog } from '@/lib/domain/config-atribuicao';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ColumnDef, Row, RowSelectionState, Table as TanstackTable } from '@tanstack/react-table';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}


interface ProcessosTableWrapperProps {
  initialData: ProcessoUnificado[];
  initialPagination: PaginationInfo | null;
  initialUsers: Record<number, { nome: string; avatarUrl?: string | null }>;
  initialTribunais: Array<{ codigo: string; nome: string }>;
}

// =============================================================================
// OPÇÕES DE FILTRO
// =============================================================================

const ORIGEM_OPTIONS: readonly FilterOption[] = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'arquivado', label: 'Arquivados' },
];

// =============================================================================
// HELPERS
// =============================================================================

const isProcessoUnificado = (processo: Processo | ProcessoUnificado): processo is ProcessoUnificado => {
  return 'instances' in processo && 'grauAtual' in processo;
};

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const formatarGrau = (grau: string): string => {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
};

const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Labels para origem
const ORIGEM_LABELS: Record<string, string> = {
  acervo_geral: 'Acervo Geral',
  arquivado: 'Arquivado',
};

/**
 * Retorna o órgão julgador do processo de forma segura
 */
function getOrgaoJulgador(processo: ProcessoUnificado): string {
  return processo.descricaoOrgaoJulgador || '-';
}

// =============================================================================
// CELL COMPONENTS
// =============================================================================

function ProcessoNumeroCell({ row }: { row: Row<ProcessoUnificado> }) {
  const processo = row.original;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = getOrgaoJulgador(processo);
  // FONTE DA VERDADE: Usar trtOrigem (1º grau) ao invés de trt (grau atual)
  // Isso garante que processos no TST ou 2º grau mostrem o tribunal de origem
  const trt = processo.trtOrigem || processo.trt;
  const isUnificado = isProcessoUnificado(processo);
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;

  return (
    <div className="flex flex-col items-start justify-center gap-1.5 py-2 min-w-0 group">
      <div className="flex items-center gap-1.5 flex-wrap">
        <SemanticBadge category="tribunal" value={trt} className="w-fit text-xs">
          {trt}
        </SemanticBadge>
        {isUnificado ? (
          <GrauBadgesSimple grausAtivos={(processo as ProcessoUnificado).grausAtivos} />
        ) : (
          <SemanticBadge category="grau" value={(processo as Processo).grau} className="w-fit text-xs">
            {formatarGrau((processo as Processo).grau)}
          </SemanticBadge>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="text-sm font-medium whitespace-nowrap">
          {classeJudicial && `${classeJudicial} `}
          {numeroProcesso}
        </div>
        <CopyButton text={numeroProcesso} label="Copiar número do processo" />
        {segredoJustica && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3.5 w-3.5 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Segredo de Justiça</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</span>
        <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
      </div>
      <div className="flex flex-col gap-0.5">
        <ParteBadge
          polo="ATIVO"
          className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
        >
          {processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-'}
        </ParteBadge>
        <ParteBadge
          polo="PASSIVO"
          className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
        >
          {processo.nomeParteReOrigem || processo.nomeParteRe || '-'}
        </ParteBadge>
      </div>
    </div>
  );
}

/**
 * Retorna as iniciais do nome para o Avatar
 */
function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Célula de Responsável com Avatar e Diálogo para alteração
 */
function ProcessoResponsavelCell({
  processo,
  usuarios = [],
  onSuccess,
}: {
  processo: ProcessoUnificado;
  usuarios?: Usuario[];
  onSuccess?: (updatedProcesso?: ProcessoUnificado) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [localProcesso, setLocalProcesso] = React.useState(processo);

  // Atualizar processo local quando o processo prop mudar
  React.useEffect(() => {
    setLocalProcesso(processo);
  }, [processo]);

  const responsavel = usuarios.find((u) => u.id === localProcesso.responsavelId);
  const nomeExibicao = responsavel?.nomeExibicao || '-';

  const handleSuccess = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    if (updatedProcesso) {
      // Update otimista: mesclar o responsavelId atualizado no processo local
      setLocalProcesso((prev) => ({ ...prev, responsavelId: updatedProcesso.responsavelId }));
    }
    onSuccess?.(updatedProcesso);
  }, [onSuccess]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
        className="flex items-center justify-start gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{responsavel.nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Não atribuído</span>
        )}
      </button>

      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={localProcesso}
        usuarios={usuarios}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// =============================================================================
// COLUMNS
// =============================================================================

function criarColunas(
  usuariosMap: Record<number, { nome: string }>,
  usuarios: Usuario[],
  onSuccess: (updatedProcesso?: ProcessoUnificado) => void,
  tagsMap: Record<number, Tag[]>,
  onOpenTagsDialog: (processo: ProcessoUnificado) => void
): ColumnDef<ProcessoUnificado>[] {
  return [
    // =========================================================================
    // COLUNAS VISÍVEIS POR PADRÃO (6 colunas originais)
    // =========================================================================
    {
      accessorKey: 'dataAutuacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Autuação" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
          {formatarData(row.original.dataAutuacao)}
        </span>
      ),
      enableSorting: true,
      size: 100,
      meta: {
        align: 'left' as const,
        headerLabel: 'Data Autuação',
      },
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Processo" />,
      cell: ({ row }) => <ProcessoNumeroCell row={row} />,
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
    },
    {
      id: 'etiquetas',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Etiquetas" />,
      cell: ({ row }) => {
        const processoTags = tagsMap[row.original.id] || [];
        return (
          <div className="flex items-center py-2 min-w-0">
            <TagBadgeList
              tags={processoTags}
              maxVisible={3}
              onClick={() => onOpenTagsDialog(row.original)}
            />
          </div>
        );
      },
      enableSorting: false,
      meta: {
        align: 'left' as const,
        headerLabel: 'Etiquetas',
      },
    },
    {
      id: 'responsavel',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" />,
      cell: ({ row }) => {
        return (
          <div className="flex items-center py-2 min-w-0">
            <ProcessoResponsavelCell
              processo={row.original}
              usuarios={usuarios}
              onSuccess={onSuccess}
            />
          </div>
        );
      },
      enableSorting: false,
      meta: {
        align: 'left' as const,
        headerLabel: 'Responsável',
      },
    },
    {
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        // Fallback para ATIVO se status for nulo (cenário de migração de dados)
        const status = row.original.status;
        return (
          <div className="flex items-center py-2">
            <ProcessoStatusBadge status={status} className="text-xs" />
          </div>
        );
      },
      enableSorting: false,
      meta: {
        align: 'left' as const,
        headerLabel: 'Status',
      },
    },
    {
      id: 'acoes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ações" />,
      cell: ({ row }) => {
        const processo = row.original;
        return (
          <div className="flex items-center py-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/processos/${processo.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Ver timeline</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      enableSorting: false,
      size: 50,
      meta: {
        align: 'left' as const,
        headerLabel: 'Ações',
      },
    },

    // =========================================================================
    // COLUNAS OCULTAS POR PADRÃO (extras do acervo)
    // NOTA: TRT, Grau, Classe Judicial, Órgão Julgador, Segredo de Justiça e
    // Próxima Audiência foram removidas pois já aparecem compostas na coluna "Processo"
    // =========================================================================

    // Prioridade Processual
    {
      id: 'prioridade',
      accessorKey: 'prioridadeProcessual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridade" />,
      cell: ({ row }) => {
        const prioridade = row.original.prioridadeProcessual;
        if (!prioridade) return <span className="text-sm text-muted-foreground">-</span>;

        const variant = prioridade >= 3 ? 'destructive' : prioridade >= 2 ? 'warning' : 'secondary';
        return (
          <AppBadge variant={variant as 'destructive' | 'secondary'} className="text-xs">
            {prioridade}
          </AppBadge>
        );
      },
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Prioridade',
      },
    },

    // Quantidade de Autores
    {
      id: 'qtde_autores',
      accessorKey: 'qtdeParteAutora',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qtde Autores" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.qtdeParteAutora ?? '-'}
        </span>
      ),
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Qtde Autores',
      },
    },

    // Quantidade de Réus
    {
      id: 'qtde_reus',
      accessorKey: 'qtdeParteRe',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qtde Réus" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.qtdeParteRe ?? '-'}
        </span>
      ),
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Qtde Réus',
      },
    },

    // Juízo Digital
    {
      id: 'juizo_digital',
      accessorKey: 'juizoDigital',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Juízo Digital" />,
      cell: ({ row }) => {
        const juizoDigital = row.original.juizoDigital;
        if (juizoDigital === true) {
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (juizoDigital === false) {
          return <XCircle className="h-4 w-4 text-muted-foreground" />;
        }
        return <span className="text-sm text-muted-foreground">-</span>;
      },
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Juízo Digital',
      },
    },

    // Data de Arquivamento
    {
      id: 'data_arquivamento',
      accessorKey: 'dataArquivamento',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Arquivamento" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
          {formatarData(row.original.dataArquivamento || null)}
        </span>
      ),
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Arquivamento',
      },
    },

    // NOTA: Próxima Audiência foi removida pois já aparece como popover na coluna "Processo"

    // Tem Associação
    {
      id: 'tem_associacao',
      accessorKey: 'temAssociacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Associação" />,
      cell: ({ row }) => {
        const temAssociacao = row.original.temAssociacao;
        if (temAssociacao) {
          return <Link2 className="h-4 w-4 text-blue-600" />;
        }
        return <span className="text-sm text-muted-foreground">-</span>;
      },
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Associação',
      },
    },

    // Origem (Acervo Geral / Arquivado)
    {
      id: 'origem',
      accessorKey: 'origem',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Origem" />,
      cell: ({ row }) => {
        const origem = row.original.origem;
        if (!origem) return <span className="text-sm text-muted-foreground">-</span>;

        const isArquivado = origem === 'arquivado';
        return (
          <AppBadge
            variant={isArquivado ? 'secondary' : 'default'}
            className={cn(
              'text-xs',
              !isArquivado && 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25'
            )}
          >
            {ORIGEM_LABELS[origem] || origem}
          </AppBadge>
        );
      },
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Origem',
      },
    },

    // Criado Em
    {
      id: 'created_at',
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado Em" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
          {formatarDataHora(row.original.createdAt || null)}
        </span>
      ),
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Criado Em',
      },
    },

    // Atualizado Em
    {
      id: 'updated_at',
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Atualizado Em" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
          {formatarDataHora(row.original.updatedAt || null)}
        </span>
      ),
      enableSorting: true,
      meta: {
        align: 'left' as const,
        headerLabel: 'Atualizado Em',
      },
    },
  ];
}

// =============================================================================
// VISIBILIDADE INICIAL DAS COLUNAS
// =============================================================================

/**
 * Configuração de visibilidade inicial das colunas.
 * Colunas não listadas aqui estarão visíveis por padrão.
 * Colunas com valor `false` estarão ocultas por padrão.
 */
const INITIAL_COLUMN_VISIBILITY: Record<string, boolean> = {
  // Colunas originais - status oculta por padrão
  status: false,

  // Colunas extras (ocultas por padrão)
  // NOTA: trt, grau, classe_judicial, orgao_julgador, segredo_justica, proxima_audiencia
  // foram removidas pois já aparecem compostas na coluna "Processo"
  prioridade: false,
  qtde_autores: false,
  qtde_reus: false,
  juizo_digital: false,
  data_arquivamento: false,
  tem_associacao: false,
  origem: false,
  created_at: false,
  updated_at: false,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ProcessosTableWrapper({
  initialData,
  initialPagination,
  initialUsers,
  initialTribunais = [],
}: ProcessosTableWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado dos dados
  const [processos, setProcessos] = React.useState<ProcessoUnificado[]>(initialData);
  const [usersMap, setUsersMap] = React.useState(initialUsers);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [table, setTable] = React.useState<TanstackTable<ProcessoUnificado> | null>(null);

  // Estado de seleção de linhas (bulk actions)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Estado de visibilidade das colunas
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(INITIAL_COLUMN_VISIBILITY);

  // Estado de paginação
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  // Estado de loading/error
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estado de busca e filtros (inicializado vazio para evitar hydration mismatch)
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [trtFilter, setTrtFilter] = React.useState<string[]>([]);
  const [origemFilter, setOrigemFilter] = React.useState<string>('all');
  const isHydratedRef = React.useRef(false);

  // Sincronizar com URL após hydration para evitar mismatch
  React.useEffect(() => {
    const search = searchParams.get('search');
    const trt = searchParams.get('trt');
    const origem = searchParams.get('origem');

    if (search) setGlobalFilter(search);
    if (trt && trt !== 'all') {
      setTrtFilter(trt.includes(',') ? trt.split(',') : [trt]);
    }
    if (origem) setOrigemFilter(origem);
    isHydratedRef.current = true;
  }, [searchParams]);

  // ── Copilot: expor contexto de processos ──
  useAgentContext({
    description: 'Dados da tela de processos: total, filtros ativos e página atual',
    value: {
      total_processos: total,
      pagina: pageIndex + 1,
      total_paginas: totalPages,
      filtros_ativos: {
        busca: globalFilter || null,
        trt: trtFilter.length > 0 ? trtFilter : null,
        origem: origemFilter !== 'all' ? origemFilter : null,
      },
      processos_visiveis: processos.length,
      carregando: isLoading,
    },
  });

  // Estado do dialog de configuração de atribuição
  const [configAtribuicaoOpen, setConfigAtribuicaoOpen] = React.useState(false);

  // Estado do dialog de criação de processo
  const [createProcessoOpen, setCreateProcessoOpen] = React.useState(false);

  // Estado de tags dos processos
  const [tagsMap, setTagsMap] = React.useState<Record<number, Tag[]>>({});
  const [tagsDialogOpen, setTagsDialogOpen] = React.useState(false);
  const [processoParaTags, setProcessoParaTags] = React.useState<ProcessoUnificado | null>(null);

  // Dados auxiliares para mostrar nomes dos responsáveis
  // Removido useUsuarios em favor de initialUsers + updates do server action

  // Carregar lista de usuários para o select do diálogo
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string; avatarUrl?: string | null }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
            avatarUrl: u.avatarUrl ?? null,
          }));
          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, []);

  // Carregar tags dos processos iniciais
  React.useEffect(() => {
    const fetchTags = async () => {
      if (initialData.length === 0) return;
      const processoIds = initialData.map((p) => p.id);
      try {
        const result = await actionListarTagsDosProcessos(processoIds);
        if (result.success) {
          setTagsMap(result.data as Record<number, Tag[]>);
        }
      } catch (error) {
        console.error('Erro ao carregar tags:', error);
      }
    };
    fetchTags();
  }, [initialData]);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Filtros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterOptions = React.useMemo(() => buildProcessosFilterOptions(initialTribunais), [initialTribunais]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterGroups = React.useMemo(() => buildProcessosFilterGroups(), []);

  const tribunaisOptions: readonly FilterOption[] = React.useMemo(
    () => initialTribunais.map((t) => ({ value: t.codigo, label: `${t.codigo} - ${t.nome}` })),
    [initialTribunais]
  );

  // Função para atualizar processo localmente (otimista)
  const updateProcessoLocal = React.useCallback((processoId: number, updates: Partial<ProcessoUnificado>) => {
    setProcessos((prev) =>
      prev.map((p) => (p.id === processoId ? { ...p, ...updates } : p))
    );
  }, []);

  const refetchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função para recarregar dados (movido para antes do useMemo de colunas)
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarProcessos({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        trt: trtFilter.length === 0 ? undefined : trtFilter,
        origem: origemFilter === 'all' ? undefined : (origemFilter as 'acervo_geral' | 'arquivado'),
      });

      if (result.success) {
        // Correcao de tipagem do payload
        const payload = result.data as {
          data: ProcessoUnificado[];
          pagination: PaginationInfo;
          referencedUsers: Record<number, { nome: string }>;
        };

        setProcessos(payload.data);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setUsersMap((prev) => ({ ...prev, ...payload.referencedUsers }));

        // Carregar tags dos processos
        const processoIds = payload.data.map((p) => p.id);
        if (processoIds.length > 0) {
          const tagsResult = await actionListarTagsDosProcessos(processoIds);
          if (tagsResult.success) {
            setTagsMap(tagsResult.data as Record<number, Tag[]>);
          }
        }

        // Atualizar URL
        const params = new URLSearchParams();
        if (pageIndex > 0) params.set('page', String(pageIndex + 1));
        if (pageSize !== 50) params.set('limit', String(pageSize));
        if (buscaDebounced) params.set('search', buscaDebounced);
        if (trtFilter.length > 0) params.set('trt', trtFilter.join(','));
        if (origemFilter !== 'all') params.set('origem', origemFilter);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar processos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, router, pathname]);

  const scheduleBackgroundRefetch = React.useCallback((delayMs = 1500) => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      refetchTimeoutRef.current = null;
      void refetch();
    }, delayMs);
  }, [refetch]);

  const handleRefetchWithUpdate = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    if (updatedProcesso) {
      updateProcessoLocal(updatedProcesso.id, {
        responsavelId: updatedProcesso.responsavelId,
        updatedAt: updatedProcesso.updatedAt,
      });
    }

    // Evita reler a view materializada cedo demais e sobrescrever o update otimista.
    scheduleBackgroundRefetch();
  }, [scheduleBackgroundRefetch, updateProcessoLocal]);

  React.useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  // Função para abrir dialog de tags
  const handleOpenTagsDialog = React.useCallback((processo: ProcessoUnificado) => {
    setProcessoParaTags(processo);
    setTagsDialogOpen(true);
  }, []);

  // Função para quando tags são atualizadas
  const handleTagsUpdated = React.useCallback((tags: Tag[]) => {
    if (processoParaTags) {
      setTagsMap((prev) => ({
        ...prev,
        [processoParaTags.id]: tags,
      }));
    }
  }, [processoParaTags]);

  // Colunas memoizadas - agora incluem usuarios, refetch, tags e dialog
  const colunas = React.useMemo(
    () => criarColunas(usersMap, usuarios, handleRefetchWithUpdate, tagsMap, handleOpenTagsDialog),
    [usersMap, usuarios, handleRefetchWithUpdate, tagsMap, handleOpenTagsDialog]
  );

  // Ref para controlar primeira renderização
  const isFirstRender = React.useRef(true);

  // Recarregar quando parâmetros mudam (skip primeira render e aguardar hydration)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Só refetch após hydration estar completa
    if (!isHydratedRef.current) return;
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, refetch]);

  const hasFilters = trtFilter.length > 0 || origemFilter !== 'all' || globalFilter.length > 0;
  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <>
      <div className="w-full">
        {/* Linha 1: Título à esquerda, botão de criar à direita */}
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold tracking-tight font-heading">Processos</h1>
          <Button
            className="h-9"
            onClick={() => setCreateProcessoOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Processo
          </Button>
        </div>

        {/* Linha 2: Filtros à esquerda, Config + Colunas à direita */}
        <div className="flex items-center gap-4 pb-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-80 min-w-40">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar processos..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPageIndex(0);
                }}
                className="h-9 w-full pl-9 bg-card"
              />
            </div>
            <FilterPopoverMulti
              label="Tribunais"
              placeholder="Buscar tribunal..."
              options={tribunaisOptions}
              value={trtFilter}
              onValueChange={(val) => {
                setTrtFilter(val);
                setPageIndex(0);
              }}
            />
            <FilterPopover
              label="Origem"
              options={ORIGEM_OPTIONS}
              value={origemFilter}
              onValueChange={(val) => {
                setOrigemFilter(val);
                setPageIndex(0);
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ProcessosBulkActions
              selectedRows={processos.filter((p) => rowSelection[p.id.toString()])}
              usuarios={usuarios}
              onSuccess={() => {
                setRowSelection({});
                refetch();
              }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-card"
                    onClick={() => setConfigAtribuicaoOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configurar atribuição automática</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {table && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-card"
                    aria-label="Visibilidade de colunas"
                  >
                    <Columns className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(value)}
                      >
                        {(column.columnDef.meta as { headerLabel?: string } | undefined)?.headerLabel || column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {showEmptyState ? (
          <ProcessosEmptyState
            onClearFilters={() => {
              setTrtFilter([]);
              setOrigemFilter('all');
              setGlobalFilter('');
              setPageIndex(0);
            }}
            hasFilters={hasFilters}
          />
        ) : (
          <DataTable
            columns={colunas}
            data={processos || []}
            tableLayout="auto"
            isLoading={isLoading}
            error={error}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onTableReady={(t) => setTable(t as TanstackTable<ProcessoUnificado>)}
            emptyMessage="Nenhum processo encontrado."
            rowSelection={{
              state: rowSelection,
              onRowSelectionChange: setRowSelection,
              getRowId: (row) => row.id.toString(),
            }}
            pagination={{
              pageIndex,
              pageSize,
              total,
              totalPages,
              onPageChange: setPageIndex,
              onPageSizeChange: setPageSize,
            }}
          />
        )}

        <TablePagination
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
          variant="integrated"
        />
      </div>

      <ConfigAtribuicaoDialog
        open={configAtribuicaoOpen}
        onOpenChange={setConfigAtribuicaoOpen}
        usuarios={usuarios}
      />

      <ProcessoTagsDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        processo={processoParaTags}
        tagsAtuais={processoParaTags ? (tagsMap[processoParaTags.id] || []) : []}
        onSuccess={handleTagsUpdated}
      />

      <ProcessoForm
        open={createProcessoOpen}
        onOpenChange={setCreateProcessoOpen}
        onSuccess={() => refetch()}
        mode="create"
      />
    </>
  );
}
