'use client';

/**
 * KanbanContratosClient — Quadro Kanban de Contratos
 *
 * Componente cliente principal da página /app/contratos/kanban.
 * - Seletor de segmento no topo (DataTableToolbar)
 * - Kanban board com colunas = estágios do pipeline
 * - Drag & drop via @dnd-kit (Kanban UI component)
 * - Atualização otimista ao mover contratos entre colunas
 *
 * @example
 * // Renderizado pelo server component page.tsx
 * <KanbanContratosClient />
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Settings, List, Kanban as KanbanIcon, Layers, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { ViewModePopover, type ViewModeOption } from '@/components/shared/view-mode-popover';
import { GlassPanel } from '@/components/shared/glass-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatarData } from '../utils';

import {
  useSegmentos,
  useKanbanContratos,
  SEM_ESTAGIO_KEY,
  type KanbanContrato,
  type KanbanColumns,
} from '@/app/(authenticated)/contratos/hooks';
import type { ContratoPipelineEstagio } from '@/app/(authenticated)/contratos/pipelines/types';

// =============================================================================
// VIEW MODE OPTIONS
// =============================================================================

const CONTRATOS_VIEW_OPTIONS: ViewModeOption[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'quadro', label: 'Kanban', icon: KanbanIcon },
];

// =============================================================================
// CARD DE CONTRATO
// =============================================================================

interface ContratoCardProps {
  contrato: KanbanContrato;
  stageCor: string;
}

function ContratoCard({ contrato, stageCor }: ContratoCardProps) {
  return (
    <GlassPanel
      depth={2}
      className="p-3 flex flex-col gap-1.5 text-sm"
      style={{ borderLeft: `3px solid ${stageCor}` }}
    >
      <p className="font-semibold text-foreground leading-tight line-clamp-2">
        {contrato.clienteNome}
      </p>
      <div className="flex flex-wrap gap-1 mt-0.5">
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 font-normal">
          {contrato.tipoContrato}
        </Badge>
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 font-normal">
          {contrato.tipoCobranca}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatarData(contrato.cadastradoEm)}
      </p>
    </GlassPanel>
  );
}

// =============================================================================
// COLUNA DO KANBAN
// =============================================================================

interface KanbanColumnContentProps {
  estagioId: string;
  estagio: ContratoPipelineEstagio | null;
  contratos: KanbanContrato[];
}

function KanbanColumnContent({
  estagioId,
  estagio,
  contratos,
}: KanbanColumnContentProps) {
  const cor = estagio?.cor ?? '#6B7280';
  const nome = estagio?.nome ?? 'Sem estágio';

  return (
    <KanbanColumn
      value={estagioId}
      className="min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 shrink-0"
    >
      <GlassPanel depth={1} className="flex flex-col gap-2 p-2.5 min-h-28">
        {/* Header da coluna */}
        <div
          className="flex items-center justify-between px-1 pb-2 border-b-2"
          style={{ borderColor: cor }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cor }}
              aria-hidden="true"
            />
            <span className="font-heading text-xs font-semibold text-foreground truncate">
              {nome}
            </span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/10 text-muted-foreground tabular-nums shrink-0"
            aria-label={`${contratos.length} contratos`}
          >
            {contratos.length}
          </span>
        </div>

        {/* Cards */}
        {contratos.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl">
            Nenhum contrato
          </div>
        ) : (
          contratos.map((contrato) => (
            <KanbanItem
              key={contrato.id}
              value={String(contrato.id)}
              asHandle
              className="rounded-xl"
            >
              <ContratoCard contrato={contrato} stageCor={cor} />
            </KanbanItem>
          ))
        )}
      </GlassPanel>
    </KanbanColumn>
  );
}

// =============================================================================
// SKELETON DO BOARD
// =============================================================================

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassPanel
          key={i}
          depth={1}
          className="flex flex-col gap-2 min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 p-2.5"
        >
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-xl" />
          ))}
        </GlassPanel>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATES
// =============================================================================

function EmptyNoPipeline({ segmentoNome }: { segmentoNome: string }) {
  return (
    <EmptyState
      icon={Layers}
      title="Nenhum pipeline configurado"
      description={`O segmento "${segmentoNome}" ainda não possui um pipeline de contratos. Configure um pipeline nas configurações para visualizar o kanban.`}
      action={
        <Button asChild variant="outline">
          <Link href="/app/contratos/pipelines">Configurar pipeline</Link>
        </Button>
      }
    />
  );
}

function EmptyNoSegmento() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Selecione um segmento"
      description="Escolha um segmento acima para visualizar o quadro kanban de contratos."
    />
  );
}

// =============================================================================
// BOARD PRINCIPAL
// =============================================================================

interface KanbanBoardContentProps {
  columns: KanbanColumns;
  estagioMap: Map<number, ContratoPipelineEstagio>;
  onMove: (contratoId: number, newEstagioId: number) => Promise<void>;
}

function KanbanBoardContent({
  columns,
  estagioMap,
  onMove,
}: KanbanBoardContentProps) {
  /**
   * O Kanban component gerencia state interno de ordering.
   * onValueChange é chamado durante o drag (para atualização visual imediata),
   * mas a persistência real acontece no onDragEnd via onMove.
   */
  const [localColumns, setLocalColumns] = React.useState<KanbanColumns>(columns);

  // Sincronizar quando as colunas externas mudam (ex: após refetch)
  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleValueChange = React.useCallback(
    (newColumns: Record<string | number, KanbanContrato[]>) => {
      setLocalColumns(newColumns as KanbanColumns);
    },
    []
  );

  const handleDragEnd = React.useCallback(
    async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event;
      if (!over) return;

      // Identificar a coluna de destino
      // Se o over.id é uma coluna, use-o diretamente. Senão, encontre a coluna
      // que contém o item destino.
      const overId = String(over.id);
      const isColumn = overId in localColumns;

      let targetColumnKey: string | null = null;

      if (isColumn) {
        targetColumnKey = overId;
      } else {
        // O item dropped sobre outro item — encontrar qual coluna o contém
        for (const [colKey, items] of Object.entries(localColumns)) {
          if (items.some((item) => String(item.id) === overId)) {
            targetColumnKey = colKey;
            break;
          }
        }
      }

      if (!targetColumnKey || targetColumnKey === SEM_ESTAGIO_KEY) return;

      const contratoId = Number(active.id);
      const newEstagioId = Number(targetColumnKey);

      if (isNaN(contratoId) || isNaN(newEstagioId) || newEstagioId <= 0) return;

      // Verificar se o item já estava nessa coluna (não precisa persistir)
      const sourceColumn = Object.entries(localColumns).find(([, items]) =>
        items.some((item) => item.id === contratoId)
      );
      if (sourceColumn?.[0] === targetColumnKey) return;

      try {
        await onMove(contratoId, newEstagioId);
      } catch {
        // O hook já faz rollback e loga o erro. Mostramos toast ao usuário.
        toast.error('Erro ao mover contrato. Tente novamente.');
        // Reverter localColumns para o estado externo (que já foi revertido no hook)
        setLocalColumns(columns);
      }
    },
    [localColumns, onMove, columns]
  );

  // Encontrar o contrato ativo para o overlay
  const getContratoById = React.useCallback(
    (id: string | number): KanbanContrato | null => {
      const numId = Number(id);
      for (const items of Object.values(localColumns)) {
        const found = items.find((item) => item.id === numId);
        if (found) return found;
      }
      return null;
    },
    [localColumns]
  );

  const getEstagioForColumn = React.useCallback(
    (colKey: string): ContratoPipelineEstagio | null => {
      if (colKey === SEM_ESTAGIO_KEY) return null;
      const id = Number(colKey);
      return estagioMap.get(id) ?? null;
    },
    [estagioMap]
  );

  return (
    <Kanban
      value={localColumns}
      onValueChange={handleValueChange}
      onDragEnd={handleDragEnd as never}
      getItemValue={(item: KanbanContrato) => String(item.id)}
      flatCursor
    >
      <KanbanBoard className="overflow-x-auto pb-4 pt-2 items-start">
        {Object.entries(localColumns).map(([colKey, items]) => {
          const estagio = getEstagioForColumn(colKey);
          // Não exibir a coluna "sem_estagio" se estiver vazia
          if (colKey === SEM_ESTAGIO_KEY && items.length === 0) return null;

          return (
            <KanbanColumnContent
              key={colKey}
              estagioId={colKey}
              estagio={estagio}
              contratos={items}
            />
          );
        })}
      </KanbanBoard>

      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant !== 'item') return null;
          const contrato = getContratoById(value);
          if (!contrato) return null;

          // Encontrar o estágio do item sendo arrastado
          const cor = contrato.estagioId
            ? (estagioMap.get(contrato.estagioId)?.cor ?? '#6B7280')
            : '#6B7280';

          return (
            <div className="min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 opacity-95 shadow-lg rotate-1">
              <ContratoCard contrato={contrato} stageCor={cor} />
            </div>
          );
        }}
      </KanbanOverlay>
    </Kanban>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function KanbanContratosClient() {
  const router = useRouter();

  const handleViewChange = React.useCallback((value: string) => {
    if (value === 'lista') {
      router.push('/app/contratos');
    }
  }, [router]);

  const [selectedSegmentoId, setSelectedSegmentoId] = React.useState<
    number | null
  >(null);

  const { segmentos, isLoading: segmentosLoading } = useSegmentos();
  const { pipeline, columns, isLoading, error, moveContrato, refetch } =
    useKanbanContratos(selectedSegmentoId);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Auto-selecionar o primeiro segmento quando carregado
  React.useEffect(() => {
    if (segmentos.length > 0 && selectedSegmentoId === null) {
      setSelectedSegmentoId(segmentos[0]!.id);
    }
  }, [segmentos, selectedSegmentoId]);

  const estagioMap = React.useMemo(() => {
    const map = new Map<number, ContratoPipelineEstagio>();
    if (pipeline) {
      for (const estagio of pipeline.estagios) {
        map.set(estagio.id, estagio);
      }
    }
    return map;
  }, [pipeline]);

  const selectedSegmento = React.useMemo(
    () => segmentos.find((s) => s.id === selectedSegmentoId) ?? null,
    [segmentos, selectedSegmentoId]
  );

  const handleSegmentoChange = React.useCallback((value: string) => {
    setSelectedSegmentoId(Number(value));
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const totalContratos = React.useMemo(
    () =>
      Object.values(columns).reduce((sum, items) => sum + items.length, 0),
    [columns]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Kanban de Contratos</Heading>
          {!isLoading && pipeline && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {pipeline.nome} &middot; {totalContratos} contrato{totalContratos !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Controles: segmento à esquerda, ações à direita */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select
          value={selectedSegmentoId !== null ? String(selectedSegmentoId) : ''}
          onValueChange={handleSegmentoChange}
          disabled={segmentosLoading}
        >
          <SelectTrigger
            className="w-50 bg-card rounded-xl"
            aria-label="Selecionar segmento"
          >
            <SelectValue
              placeholder={segmentosLoading ? 'Carregando...' : 'Segmento'}
            />
          </SelectTrigger>
          <SelectContent>
            {segmentos.map((segmento) => (
              <SelectItem key={segmento.id} value={String(segmento.id)}>
                {segmento.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-card rounded-xl cursor-pointer"
                    aria-label="Configurações de contratos"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/tipos">Tipos de Contrato</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/tipos-cobranca">Tipos de Cobrança</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/pipelines">Pipelines</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void handleRefresh()}
            disabled={isLoading || isRefreshing}
            aria-label="Atualizar kanban"
            className="h-9 w-9 bg-card rounded-xl cursor-pointer"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                (isLoading || isRefreshing) && 'animate-spin'
              )}
              aria-hidden="true"
            />
          </Button>

          <ViewModePopover
            value="quadro"
            onValueChange={handleViewChange}
            options={CONTRATOS_VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* Estado de carregamento */}
      {isLoading && <KanbanBoardSkeleton />}

      {/* Erro */}
      {!isLoading && error && (
        <InsightBanner type="alert">{error}</InsightBanner>
      )}

      {/* Nenhum segmento selecionado */}
      {!isLoading && !error && selectedSegmentoId === null && (
        <EmptyNoSegmento />
      )}

      {/* Pipeline não configurado para o segmento */}
      {!isLoading &&
        !error &&
        selectedSegmentoId !== null &&
        pipeline === null && (
          <EmptyNoPipeline
            segmentoNome={selectedSegmento?.nome ?? 'selecionado'}
          />
        )}

      {/* Board */}
      {!isLoading && !error && pipeline !== null && (
        <KanbanBoardContent
          columns={columns}
          estagioMap={estagioMap}
          onMove={moveContrato}
        />
      )}
    </div>
  );
}
