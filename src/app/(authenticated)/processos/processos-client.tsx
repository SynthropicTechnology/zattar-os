'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination } from '@/components/shared/data-shell';
import { ProcessosPulseStrip } from './components/processos-pulse-strip';
import { ProcessosInsightBanner } from './components/processos-insight-banner';
import { ProcessoCard } from './components/processo-card';
import { ProcessoListRow } from './components/processo-list-row';
import { actionListarProcessos } from './actions';
import type { ProcessoUnificado, ListarProcessosParams } from './domain';
import type { ProcessoStats } from './service-estatisticas';
import { Heading } from '@/components/ui/typography';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface ProcessosClientProps {
  initialProcessos: ProcessoUnificado[];
  initialTotal: number;
  initialStats: ProcessoStats;
  tribunais?: string[];
  usuarios: Usuario[];
  currentUserId: number;
}

type ProcessoTab = 'todos' | 'meus' | 'sem_responsavel' | 'com_eventos';

const PAGE_SIZE = 50;

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'lista', icon: List, label: 'Lista' },
];

export function ProcessosClient({
  initialProcessos,
  initialTotal,
  initialStats,
  tribunais: _tribunais,
  usuarios,
  currentUserId,
}: ProcessosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [processos, setProcessos] = useState(initialProcessos);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState(initialStats);

  const [activeTab, setActiveTab] = useState<ProcessoTab>('todos');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [viewMode, setViewMode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'cards';
    return localStorage.getItem('processos_view_mode') || 'cards';
  });

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('processos_view_mode', viewMode);
  }, [viewMode]);

  const usersMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  // ── Server-side fetch quando tab, página ou busca mudam ──────────────
  const fetchProcessos = useCallback(
    async (tab: ProcessoTab, page: number, busca: string) => {
      const params: ListarProcessosParams = {
        pagina: page + 1,
        limite: PAGE_SIZE,
        unified: true,
      };

      if (busca) params.busca = busca;

      switch (tab) {
        case 'meus':
          params.responsavelId = currentUserId;
          break;
        case 'sem_responsavel':
          params.semResponsavel = true;
          break;
        case 'com_eventos':
          params.processoIds = stats.processoIdsComEventos;
          break;
      }

      const result = await actionListarProcessos(params);

      if (result.success) {
        const data = result.data as {
          data: ProcessoUnificado[];
          pagination: { total: number };
        };
        setProcessos(data.data);
        setTotal(data.pagination.total);
      }
    },
    [currentUserId, stats.processoIdsComEventos]
  );

  // Re-fetch quando filtros mudam (pula o primeiro render — dados vêm do SSR)
  const isInitialRender = useMemo(() => ({ current: true }), []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    startTransition(() => {
      fetchProcessos(activeTab, pageIndex, debouncedSearch);
    });
  }, [activeTab, pageIndex, debouncedSearch, fetchProcessos, isInitialRender]);

  // Reset página ao mudar tab ou busca
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as ProcessoTab);
    setPageIndex(0);
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch]);

  const handleNavigateToProcesso = useCallback((processo: ProcessoUnificado) => {
    router.push(`/processos/${processo.id}`);
  }, [router]);

  const handleUpdateResponsavel = useCallback((processoId: number, novoResponsavelId: number | null) => {
    setProcessos((prev) =>
      prev.map((p) =>
        p.id === processoId ? { ...p, responsavelId: novoResponsavelId } : p
      )
    );
  }, []);

  // ── Tab counts vêm das stats (server-side, sempre corretas) ──────────
  const tabOptions: TabPillOption[] = useMemo(() => [
    { id: 'todos', label: 'Todos', count: stats.total },
    { id: 'meus', label: 'Meus' },
    { id: 'sem_responsavel', label: 'Sem Resp', count: stats.semResponsavel },
    { id: 'com_eventos', label: 'Com Eventos', count: stats.comEventos },
  ], [stats]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const subtitle = `${stats.total} processo${stats.total !== 1 ? 's' : ''}${stats.emCurso > 0 ? ` · ${stats.emCurso} em curso` : ''}`;

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <Heading level="page">Processos</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <ProcessosPulseStrip stats={stats} />

      <ProcessosInsightBanner
        stats={stats}
        onFilterSemResponsavel={() => handleTabChange('sem_responsavel')}
        onFilterComEventos={() => handleTabChange('com_eventos')}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={tabOptions}
          active={activeTab}
          onChange={handleTabChange}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar processos..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      <div className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {processos.map((processo) => (
              <ProcessoCard
                key={processo.id}
                processo={processo}
                responsavel={usersMap.get(processo.responsavelId ?? 0)}
                usuarios={usuarios}
                onClick={() => handleNavigateToProcesso(processo)}
                onUpdateResponsavel={handleUpdateResponsavel}
              />
            ))}
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="space-y-1">
            {processos.map((processo) => (
              <ProcessoListRow
                key={processo.id}
                processo={processo}
                responsavel={usersMap.get(processo.responsavelId ?? 0)}
                usuarios={usuarios}
                onClick={() => handleNavigateToProcesso(processo)}
                onUpdateResponsavel={handleUpdateResponsavel}
              />
            ))}
          </div>
        )}

        {processos.length === 0 && !isPending && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground/50">Nenhum processo encontrado</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar a busca ou os filtros</p>
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <DataPagination
          pageIndex={pageIndex}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPageIndex}
          onPageSizeChange={() => void 0}
        />
      )}
    </>
  );
}
