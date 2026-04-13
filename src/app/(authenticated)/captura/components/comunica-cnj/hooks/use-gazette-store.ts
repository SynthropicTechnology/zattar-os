'use client';

import { create } from 'zustand';
import type {
  GazetteFilters,
  GazetteMetrics,
  ComunicacaoCNJEnriquecida,
  GazetteView,
  SyncLogEntry,
  GazetteInsight,
} from '@/app/(authenticated)/captura/comunica-cnj/domain';

interface GazetteState {
  // Data
  comunicacoes: ComunicacaoCNJEnriquecida[];
  metricas: GazetteMetrics | null;
  views: GazetteView[];
  syncLogs: SyncLogEntry[];
  insights: GazetteInsight[];

  // UI state
  filtros: GazetteFilters;
  viewAtiva: string;
  modoVisualizacao: 'tabela' | 'cards';
  densidade: 'compacto' | 'padrao' | 'confortavel';
  comunicacaoSelecionada: ComunicacaoCNJEnriquecida | null;
  detailPanelAberto: boolean;
  kpiAtivo: string | null;
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  setFiltros: (filtros: Partial<GazetteFilters>) => void;
  limparFiltros: () => void;
  setViewAtiva: (view: string) => void;
  setModoVisualizacao: (modo: 'tabela' | 'cards') => void;
  setDensidade: (d: 'compacto' | 'padrao' | 'confortavel') => void;
  selecionarComunicacao: (c: ComunicacaoCNJEnriquecida | null) => void;
  toggleDetailPanel: (aberto?: boolean) => void;
  toggleKpi: (kpi: string | null) => void;
  setComunicacoes: (c: ComunicacaoCNJEnriquecida[]) => void;
  setMetricas: (m: GazetteMetrics) => void;
  setViews: (v: GazetteView[]) => void;
  setSyncLogs: (l: SyncLogEntry[]) => void;
  setInsights: (i: GazetteInsight[]) => void;
  setIsLoading: (l: boolean) => void;
  setIsSyncing: (s: boolean) => void;
}

export const useGazetteStore = create<GazetteState>((set) => ({
  // Data
  comunicacoes: [],
  metricas: null,
  views: [],
  syncLogs: [],
  insights: [],

  // UI state
  filtros: {},
  viewAtiva: 'todas',
  modoVisualizacao: 'tabela',
  densidade: 'padrao',
  comunicacaoSelecionada: null,
  detailPanelAberto: false,
  kpiAtivo: null,
  isLoading: false,
  isSyncing: false,

  // Actions
  setFiltros: (filtros) =>
    set((state) => ({ filtros: { ...state.filtros, ...filtros } })),
  limparFiltros: () => set({ filtros: {}, kpiAtivo: null }),
  setViewAtiva: (view) => set({ viewAtiva: view }),
  setModoVisualizacao: (modo) => set({ modoVisualizacao: modo }),
  setDensidade: (d) => set({ densidade: d }),
  selecionarComunicacao: (c) =>
    set({ comunicacaoSelecionada: c, detailPanelAberto: c !== null }),
  toggleDetailPanel: (aberto) =>
    set((state) => ({
      detailPanelAberto: aberto ?? !state.detailPanelAberto,
      comunicacaoSelecionada: aberto === false ? null : state.comunicacaoSelecionada,
    })),
  toggleKpi: (kpi) =>
    set((state) => ({
      kpiAtivo: state.kpiAtivo === kpi ? null : kpi,
    })),
  setComunicacoes: (c) => set({ comunicacoes: c }),
  setMetricas: (m) => set({ metricas: m }),
  setViews: (v) => set({ views: v }),
  setSyncLogs: (l) => set({ syncLogs: l }),
  setInsights: (i) => set({ insights: i }),
  setIsLoading: (l) => set({ isLoading: l }),
  setIsSyncing: (s) => set({ isSyncing: s }),
}));
