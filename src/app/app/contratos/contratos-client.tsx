'use client';

/**
 * ContratosClient — Componente cliente do modulo Contratos.
 *
 * Renderiza a UI "Contract Pipeline Intelligence" para visualizacao de
 * contratos em modo pipeline, kanban ou lista, com KPIs financeiros
 * e funil de conversao.
 *
 * Uso:
 *   <ContratosClient />
 *   <ContratosClient initialStats={{ total: 68, novosMes: 4, ... }} />
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, FileText, GitBranch, Kanban, List } from 'lucide-react';
import {
  InsightBanner,
} from '@/app/app/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import {
  actionListarContratos,
  actionContarContratosPorStatus,
  actionResolverNomesEntidadesContrato,
  actionListarSegmentos,
} from '@/features/contratos/actions';
import type { Contrato, StatusContrato } from '@/features/contratos/domain';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '@/features/contratos/domain';
import {
  FinancialStrip,
  PipelineFunnel,
  KanbanColumn,
  ContratoListRow,
  type ContratosStatsData,
  type ContratoCardData,
} from '@/features/contratos';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { id: StatusContrato; label: string; color: string }[] = [
  { id: 'em_contratacao', label: 'Em Contratação', color: 'hsl(var(--warning))' },
  { id: 'contratado', label: 'Contratado', color: 'hsl(var(--primary))' },
  { id: 'distribuido', label: 'Distribuído', color: 'hsl(var(--success))' },
  { id: 'desistencia', label: 'Desistência', color: 'hsl(var(--destructive))' },
];

type ViewMode = 'pipeline' | 'kanban' | 'lista';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'pipeline', icon: GitBranch, label: 'Pipeline' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratosClientProps {
  initialStats?: ContratosStatsData;
}

interface NomeLookup {
  id: number;
  nome: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDiasNoEstagio(contrato: Contrato): number {
  // Estima dias no estágio atual com base em statusHistorico
  const historico = contrato.statusHistorico ?? [];
  // Ordena do mais recente para o mais antigo
  const ordenado = [...historico].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );

  // Procura a ultima transicao para o status atual
  const ultimaTransicao = ordenado.find((h) => h.toStatus === contrato.status);
  if (ultimaTransicao) {
    const desde = new Date(ultimaTransicao.changedAt);
    const agora = new Date();
    return Math.floor((agora.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Fallback: dias desde cadastradoEm
  if (contrato.cadastradoEm) {
    const desde = new Date(contrato.cadastradoEm);
    const agora = new Date();
    return Math.floor((agora.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
  }

  return 0;
}

function mapContratoToCardData(
  contrato: Contrato,
  clientesMap: Map<number, string>,
  partesMap: Map<number, string>,
  usuariosMap: Map<number, string>,
  segmentosMap: Map<number, string>,
): ContratoCardData {
  // Resolve nome do cliente
  const clienteParte = contrato.partes?.find(
    (p) => p.tipoEntidade === 'cliente',
  );
  const parteContrariaItem = contrato.partes?.find(
    (p) => p.tipoEntidade === 'parte_contraria',
  );

  const clienteNome =
    clienteParte?.nomeSnapshot ||
    clientesMap.get(contrato.clienteId) ||
    `Cliente #${contrato.clienteId}`;

  const parteContrariaId = parteContrariaItem?.entidadeId;
  const parteContrariaNome = parteContrariaItem
    ? parteContrariaItem.nomeSnapshot ||
      (parteContrariaId ? partesMap.get(parteContrariaId) : undefined) ||
      `Parte #${parteContrariaId}`
    : undefined;

  const responsavelNome = contrato.responsavelId
    ? usuariosMap.get(contrato.responsavelId) || `Responsável #${contrato.responsavelId}`
    : '—';

  const segmentoNome = contrato.segmentoId
    ? segmentosMap.get(contrato.segmentoId) || `Segmento #${contrato.segmentoId}`
    : 'Geral';

  // Estima se cliente e PJ pelo nome (heuristica simples: presenca de "Ltda", "S/A", etc.)
  const isPj =
    /\b(ltda|s\/a|sa|me|eireli|epp|s\.a|inc|corp|company|empresa|industria|comercio)\b/i.test(
      clienteNome,
    );

  return {
    id: contrato.id,
    cliente: clienteNome,
    clienteTipo: isPj ? 'pj' : 'pf',
    parteContraria: parteContrariaNome,
    tipo: TIPO_CONTRATO_LABELS[contrato.tipoContrato] ?? contrato.tipoContrato,
    cobranca: TIPO_COBRANCA_LABELS[contrato.tipoCobranca] ?? contrato.tipoCobranca,
    segmento: segmentoNome,
    status: contrato.status,
    valor: 0, // v1: sem campo valor na tabela contratos; placeholder
    cadastradoEm: contrato.cadastradoEm,
    responsavel: responsavelNome,
    diasNoEstagio: calcDiasNoEstagio(contrato),
    processosVinculados: contrato.processos?.length ?? 0,
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KanbanColumnSkeleton() {
  return (
    <div className="flex-1 min-w-65 flex flex-col gap-2 animate-pulse">
      <div className="h-8 bg-muted-foreground/10 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl border border-border/20 bg-muted-foreground/5" />
      ))}
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl animate-pulse">
      <div className="size-2.5 rounded-full bg-muted-foreground/10 shrink-0" />
      <div className="size-8 rounded-lg bg-muted-foreground/10 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-muted-foreground/10 rounded w-48" />
        <div className="h-2 bg-muted-foreground/8 rounded w-28" />
      </div>
      <div className="h-2 bg-muted-foreground/8 rounded w-16 hidden sm:block" />
      <div className="h-2 bg-muted-foreground/8 rounded w-24" />
      <div className="h-2 bg-muted-foreground/8 rounded w-10" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContratosClient({ initialStats }: ContratosClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [search, setSearch] = useState('');
  const [activeSegmento, setActiveSegmento] = useState('todos');

  const [contratos, setContratos] = useState<ContratoCardData[]>([]);
  const [stats, setStats] = useState<ContratosStatsData>(
    initialStats ?? {
      total: 0,
      novosMes: 0,
      taxaConversao: 0,
      trendMensal: [],
    },
  );
  const [segmentoTabs, setSegmentoTabs] = useState<TabPillOption[]>([
    { id: 'todos', label: 'Todos', count: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchContratos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarContratos({ pagina: 1, limite: 100 });

      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      const rawData = result.data as { data: Contrato[]; pagination: { total: number } };
      const rawContratos: Contrato[] = rawData?.data ?? [];

      // Extrai IDs para resolucao de nomes
      const clienteIds = Array.from(new Set(rawContratos.map((c) => c.clienteId)));
      const partesIds = Array.from(
        new Set(
          rawContratos.flatMap(
            (c) =>
              c.partes
                ?.filter((p) => p.tipoEntidade === 'parte_contraria')
                .map((p) => p.entidadeId) ?? [],
          ),
        ),
      );
      const usuariosIds = Array.from(
        new Set(rawContratos.map((c) => c.responsavelId).filter((id): id is number => id !== null)),
      );

      // Resolve nomes em paralelo com stats por status
      const [nomesResult, statusResult] = await Promise.all([
        actionResolverNomesEntidadesContrato({
          clienteIds,
          partesContrariasIds: partesIds,
          usuariosIds,
        }),
        actionContarContratosPorStatus(),
      ]);

      // Monta mapas de lookup
      const clientesMap = new Map<number, string>();
      const partesMap = new Map<number, string>();
      const usuariosMap = new Map<number, string>();

      if (nomesResult.success) {
        nomesResult.data.clientes.forEach((c: NomeLookup) => clientesMap.set(c.id, c.nome));
        nomesResult.data.partesContrarias.forEach((p: NomeLookup) => partesMap.set(p.id, p.nome));
        nomesResult.data.usuarios.forEach((u: NomeLookup) => usuariosMap.set(u.id, u.nome));
      }

      // Segmentos map — busca os segmentos disponíveis
      const segmentosMap = new Map<number, string>();
      try {
        const segResult = await actionListarSegmentos();
        if (segResult.success) {
          segResult.data.forEach((s: { id: number; nome: string }) => segmentosMap.set(s.id, s.nome));
        }
      } catch {
        // segmentos nao criticos
      }

      // Mapeia contratos para ContratoCardData
      const mapped = rawContratos.map((c) =>
        mapContratoToCardData(c, clientesMap, partesMap, usuariosMap, segmentosMap),
      );

      setContratos(mapped);

      // Calcula stats
      const totalGeral = rawData?.pagination?.total ?? rawContratos.length;
      const contagemPorStatus = statusResult.success ? statusResult.data : null;

      // Taxa de conversao: contratados / (contratados + desistencias)
      const contratados = contagemPorStatus?.contratado ?? 0;
      const distribuidos = contagemPorStatus?.distribuido ?? 0;
      const desistencias = contagemPorStatus?.desistencia ?? 0;
      const totalFechados = contratados + distribuidos + desistencias;
      const taxaConversao =
        totalFechados > 0 ? Math.round(((contratados + distribuidos) / totalFechados) * 100) : 0;

      // Novos este mês: contratos com cadastradoEm no mês atual
      const hoje = new Date();
      const novosMes = rawContratos.filter((c) => {
        if (!c.cadastradoEm) return false;
        const d = new Date(c.cadastradoEm);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
      }).length;

      setStats({
        total: totalGeral,
        novosMes,
        taxaConversao,
        trendMensal: [], // v1: sem serie historica disponivel
      });

      // Monta tabs de segmento dinamicamente
      const segmentosNaBase = Array.from(
        new Map(
          rawContratos
            .filter((c) => c.segmentoId !== null)
            .map((c) => [
              c.segmentoId!,
              segmentosMap.get(c.segmentoId!) ?? `Segmento ${c.segmentoId}`,
            ]),
        ).entries(),
      );

      const tabs: TabPillOption[] = [
        { id: 'todos', label: 'Todos', count: totalGeral },
        ...segmentosNaBase.map(([id, nome]) => ({
          id: String(id),
          label: nome,
          count: rawContratos.filter((c) => c.segmentoId === id).length,
        })),
      ];
      setSegmentoTabs(tabs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  // ─── Filtering ────────────────────────────────────────────────────────────────

  const filteredContratos = contratos.filter((c) => {
    if (activeSegmento !== 'todos') {
      // Compara pelo nome do segmento (tab id = segmento id numerico ou nome)
      const tabSelecionada = segmentoTabs.find((t) => t.id === activeSegmento);
      if (tabSelecionada && tabSelecionada.id !== 'todos') {
        if (c.segmento !== tabSelecionada.label) return false;
      }
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        c.cliente.toLowerCase().includes(s) ||
        c.parteContraria?.toLowerCase().includes(s) ||
        c.tipo.toLowerCase().includes(s) ||
        c.segmento.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Contratos parados em negociação há +30 dias
  const stuckContratos = contratos.filter(
    (c) => c.diasNoEstagio > 30 && c.status === 'em_contratacao',
  );

  // Dados para o funil
  const funnelStages = PIPELINE_STAGES.map((stage) => {
    const stageContratos = filteredContratos.filter((c) => c.status === stage.id);
    return {
      ...stage,
      count: stageContratos.length,
      valor: stageContratos.reduce((sum, c) => sum + c.valor, 0),
    };
  });

  const desistenciaStage = funnelStages.find((s) => s.id === 'desistencia');

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {isLoading
              ? 'Carregando...'
              : `${stats.total} contrato${stats.total !== 1 ? 's' : ''}${
                  stats.novosMes > 0 ? ` · ${stats.novosMes} novo${stats.novosMes !== 1 ? 's' : ''} este mês` : ''
                }`}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          <Plus className="size-3.5" />
          Novo contrato
        </button>
      </div>

      {/* ── Financial Strip ───────────────────────────────────── */}
      <FinancialStrip stats={stats} />

      {/* ── Pipeline Funnel ───────────────────────────────────── */}
      <PipelineFunnel
        stages={funnelStages}
        desistencias={
          desistenciaStage
            ? { count: desistenciaStage.count, valor: desistenciaStage.valor }
            : undefined
        }
      />

      {/* ── Insight Banner ────────────────────────────────────── */}
      {!isLoading && stuckContratos.length > 0 && (
        <InsightBanner type="warning">
          {stuckContratos.length} contrato{stuckContratos.length > 1 ? 's' : ''} em negociação há
          30+ dias — considere follow-up com {stuckContratos.length > 1 ? 'esses clientes' : 'esse cliente'}
        </InsightBanner>
      )}

      {/* ── Error State ───────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/4 px-4 py-3 text-xs text-destructive/80 flex items-center gap-2">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── View Controls ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills tabs={segmentoTabs} active={activeSegmento} onChange={setActiveSegmento} />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente, parte, tipo..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={(m) => setViewMode(m as ViewMode)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}

      {/* Pipeline view: todas as colunas incluindo desistencia */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <KanbanColumnSkeleton key={i} />)
            : PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  contratos={filteredContratos.filter((c) => c.status === stage.id)}
                />
              ))}
        </div>
      )}

      {/* Kanban view: sem desistencia */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <KanbanColumnSkeleton key={i} />)
            : PIPELINE_STAGES.filter((s) => s.id !== 'desistencia').map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  contratos={filteredContratos.filter((c) => c.status === stage.id)}
                />
              ))}
        </div>
      )}

      {/* Lista view */}
      {viewMode === 'lista' && (
        <div className="flex flex-col gap-1">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ListRowSkeleton key={i} />)
            : filteredContratos.map((c) => {
                const stage = PIPELINE_STAGES.find((s) => s.id === c.status);
                return (
                  <ContratoListRow
                    key={c.id}
                    contrato={c}
                    stageColor={stage?.color}
                    stageLabel={STATUS_CONTRATO_LABELS[c.status as StatusContrato] ?? c.status}
                  />
                );
              })}

          {!isLoading && filteredContratos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">
                Nenhum contrato encontrado
              </p>
              <p className="text-xs text-muted-foreground/55 mt-1">
                {search ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
