'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { ProcessosPulseStrip } from './components/processos-pulse-strip';
import { ProcessosInsightBanner } from './components/processos-insight-banner';
import { ProcessoCard } from './components/processo-card';
import { ProcessoListRow } from './components/processo-list-row';
import { ProcessoDetailSheet } from './components/processo-detail-sheet';
import type { ProcessoUnificado } from './domain';
import type { ProcessoStats } from './service-estatisticas';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface ProcessosClientProps {
  initialProcessos: ProcessoUnificado[];
  initialTotal: number;
  initialStats: ProcessoStats;
  tribunais: string[];
  usuarios: Usuario[];
  currentUserId: number;
}

type ProcessoTab = 'todos' | 'meus' | 'sem_responsavel' | 'com_eventos';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'lista', icon: List, label: 'Lista' },
];

export function ProcessosClient({
  initialProcessos,
  initialTotal,
  initialStats,
  tribunais,
  usuarios,
  currentUserId,
}: ProcessosClientProps) {
  const router = useRouter();

  const [processos] = useState(initialProcessos);
  const [total] = useState(initialTotal);
  const [stats] = useState(initialStats);
  const eventosSet = useMemo(() => new Set(stats.processoIdsComEventos), [stats.processoIdsComEventos]);

  const [activeTab, setActiveTab] = useState<ProcessoTab>('todos');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [viewMode, setViewMode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'cards';
    return localStorage.getItem('processos_view_mode') || 'cards';
  });

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 50;

  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoUnificado | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('processos_view_mode', viewMode);
  }, [viewMode]);

  const usersMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  const filteredProcessos = useMemo(() => {
    let filtered = processos;

    switch (activeTab) {
      case 'meus':
        filtered = filtered.filter((p) => p.responsavelId === currentUserId);
        break;
      case 'sem_responsavel':
        filtered = filtered.filter((p) => !p.responsavelId);
        break;
      case 'com_eventos':
        filtered = filtered.filter((p) => eventosSet.has(p.id));
        break;
    }

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        p.numeroProcesso?.toLowerCase().includes(searchLower) ||
        (p.nomeParteAutora || p.nomeParteAutoraOrigem || '').toLowerCase().includes(searchLower) ||
        (p.nomeParteRe || p.nomeParteReOrigem || '').toLowerCase().includes(searchLower) ||
        (p.descricaoOrgaoJulgador || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [processos, activeTab, debouncedSearch, currentUserId, eventosSet]);

  const paginatedProcessos = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredProcessos.slice(start, start + pageSize);
  }, [filteredProcessos, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [activeTab, debouncedSearch]);

  const tabOptions: TabPillOption[] = useMemo(() => [
    { id: 'todos', label: 'Todos', count: processos.length },
    { id: 'meus', label: 'Meus' },
    { id: 'sem_responsavel', label: 'Sem Resp', count: stats.semResponsavel },
    { id: 'com_eventos', label: 'Com Eventos', count: stats.comEventos },
  ], [processos.length, stats]);

  const handleSelectProcesso = useCallback((processo: ProcessoUnificado) => {
    setSelectedProcesso(processo);
    setIsDetailOpen(true);
  }, []);

  const totalFiltered = filteredProcessos.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const subtitle = `${total} processo${total !== 1 ? 's' : ''}${stats.emCurso > 0 ? ` · ${stats.emCurso} em curso` : ''}`;

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Processos</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <ProcessosPulseStrip stats={stats} />

      <ProcessosInsightBanner
        stats={stats}
        onFilterSemResponsavel={() => setActiveTab('sem_responsavel')}
        onFilterComEventos={() => setActiveTab('com_eventos')}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={tabOptions}
          active={activeTab}
          onChange={(id) => setActiveTab(id as ProcessoTab)}
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

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedProcessos.map((processo) => (
            <ProcessoCard
              key={processo.id}
              processo={processo}
              responsavel={usersMap.get(processo.responsavelId ?? 0)}
              isSelected={selectedProcesso?.id === processo.id}
              onClick={() => handleSelectProcesso(processo)}
            />
          ))}
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="space-y-1">
          {paginatedProcessos.map((processo) => (
            <ProcessoListRow
              key={processo.id}
              processo={processo}
              responsavel={usersMap.get(processo.responsavelId ?? 0)}
              isSelected={selectedProcesso?.id === processo.id}
              onClick={() => handleSelectProcesso(processo)}
            />
          ))}
        </div>
      )}

      {paginatedProcessos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum processo encontrado</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar a busca ou os filtros</p>
        </div>
      )}

      {totalFiltered > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground/50">
            {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, totalFiltered)} de {totalFiltered}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              ‹
            </button>
            <span className="text-xs font-medium tabular-nums px-2">
              {pageIndex + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <ProcessoDetailSheet
        processo={selectedProcesso}
        responsavel={selectedProcesso ? usersMap.get(selectedProcesso.responsavelId ?? 0) : undefined}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
