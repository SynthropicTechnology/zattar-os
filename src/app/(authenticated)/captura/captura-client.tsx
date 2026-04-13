'use client';

import { useState, useCallback } from 'react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Plus, History, CalendarClock, KeyRound, Landmark, List, LayoutGrid } from 'lucide-react';

import { CapturaKpiStrip } from './components/captura-kpi-strip';
import type { CapturaKpiData } from './components/captura-kpi-strip';
import { CapturaFilterBar } from './components/captura-filter-bar';
import type { CapturaFilters } from './components/captura-filter-bar';
import { CapturaGlassList } from './components/captura-glass-list';
import { CapturaDialog } from './components/captura-dialog';

// Sub-tab content (existing components, will be refactored in later tasks)
import CredenciaisClient from './credenciais/page-client';
import TribunaisClient from './tribunais/page-client';
import AgendamentosClient from './agendamentos/page-client';

// --- Constants ---

type CapturaTab = 'historico' | 'agendamentos' | 'credenciais' | 'tribunais';

const TABS = [
  { value: 'historico', label: 'Histórico', icon: <History className="size-4" /> },
  { value: 'agendamentos', label: 'Agendamentos', icon: <CalendarClock className="size-4" /> },
  { value: 'credenciais', label: 'Credenciais', icon: <KeyRound className="size-4" /> },
  { value: 'tribunais', label: 'Tribunais', icon: <Landmark className="size-4" /> },
];

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
];

// --- Component ---

export function CapturaClient() {
  // Tab state
  const [activeTab, setActiveTab] = useState<CapturaTab>('historico');

  // View mode for historico
  const [viewMode, setViewMode] = useState('lista');

  // Filters and search
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CapturaFilters>({
    tipo: null,
    status: null,
    tribunal: null,
  });

  // Dialog state
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // KPI data (computed from capturas in glass-list)
  const [kpiData, setKpiData] = useState<CapturaKpiData>({
    total: 0,
    sucesso: 0,
    emAndamento: 0,
    falhas: 0,
    taxaSucesso: 0,
  });

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as CapturaTab);
  }, []);

  const handleCapturaSuccess = useCallback(() => {
    setCapturaDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Captura</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            Automação de captura judicial — PJE/TRT
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setCapturaDialogOpen(true)}
        >
          <Plus className="size-3.5" />
          Nova Captura
        </Button>
      </div>

      {/* Tab Pills */}
      <AnimatedIconTabs
        tabs={TABS}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-fit"
      />

      {/* Histórico View */}
      {activeTab === 'historico' && (
        <>
          {/* KPI Strip */}
          <CapturaKpiStrip data={kpiData} />

          {/* Filter Bar + Search + View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CapturaFilterBar filters={filters} onChange={setFilters} />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar capturas..."
              />
              <ViewToggle
                mode={viewMode}
                onChange={setViewMode}
                options={VIEW_OPTIONS}
              />
            </div>
          </div>

          {/* Content */}
          <CapturaGlassList
            key={refreshKey}
            search={search}
            filters={filters}
            onKpiUpdate={setKpiData}
          />
        </>
      )}

      {/* Other tabs — render existing components (will be refactored in Tasks 5-7) */}
      {activeTab === 'agendamentos' && <AgendamentosClient />}
      {activeTab === 'credenciais' && <CredenciaisClient />}
      {activeTab === 'tribunais' && <TribunaisClient />}

      {/* New Capture Dialog */}
      <CapturaDialog
        open={capturaDialogOpen}
        onOpenChange={setCapturaDialogOpen}
        onSuccess={handleCapturaSuccess}
      />
    </div>
  );
}
