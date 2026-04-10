'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination } from '@/components/shared/data-shell';
import { ProcessosPulseStrip } from './components/processos-pulse-strip';
import { ProcessoCard } from './components/processo-card';
import { ProcessoListRow } from './components/processo-list-row';
import { ProcessosFilterBar, type ProcessosFilters } from './components/processos-filter-bar';
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

const PAGE_SIZE = 50;

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'lista', icon: List, label: 'Lista' },
];

const INITIAL_FILTERS: ProcessosFilters = {
  origem: 'acervo_geral',
  responsavel: null,
  trt: [],
  grau: null,
  comEventos: false,
};

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

  const [filters, setFilters] = useState<ProcessosFilters>(INITIAL_FILTERS);
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

  // ── Build server params from unified filters ─────────────────────────
  const buildParams = useCallback(
    (f: ProcessosFilters, page: number, busca: string): ListarProcessosParams => {
      const params: ListarProcessosParams = {
        pagina: page + 1,
        limite: PAGE_SIZE,
        unified: true,
      };

      if (busca) params.busca = busca;

      // Origem
      if (f.origem) params.origem = f.origem;

      // Responsável (meus / sem / específico)
      if (f.responsavel === 'meus') {
        params.responsavelId = currentUserId;
      } else if (f.responsavel === 'sem_responsavel') {
        params.semResponsavel = true;
      } else if (typeof f.responsavel === 'number') {
        params.responsavelId = f.responsavel;
      }

      // TRT
      if (f.trt.length > 0) params.trt = f.trt;

      // Grau
      if (f.grau) params.grau = f.grau as ListarProcessosParams['grau'];

      // Com Eventos
      if (f.comEventos) {
        params.processoIds = stats.processoIdsComEventos;
      }

      return params;
    },
    [currentUserId, stats.processoIdsComEventos]
  );

  // ── Server-side fetch ────────────────────────────────────────────────
  const fetchProcessos = useCallback(
    async (f: ProcessosFilters, page: number, busca: string) => {
      const params = buildParams(f, page, busca);
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
    [buildParams]
  );

  // Re-fetch quando filtros mudam (pula primeiro render — SSR)
  const isInitialRender = useMemo(() => ({ current: true }), []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    startTransition(() => {
      fetchProcessos(filters, pageIndex, debouncedSearch);
    });
  }, [filters, pageIndex, debouncedSearch, fetchProcessos, isInitialRender]);

  // Reset page on filter/search change
  const handleFiltersChange = useCallback((newFilters: ProcessosFilters) => {
    setFilters(newFilters);
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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <ProcessosFilterBar
            filters={filters}
            onChange={handleFiltersChange}
            usuarios={usuarios}
            currentUserId={currentUserId}
            stats={stats}
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
            <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar os filtros ou a busca</p>
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
