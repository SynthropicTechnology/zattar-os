'use client';

import { useState, useCallback } from 'react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { Plus, List, LayoutGrid, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { CapturaKpiStrip } from './components/captura-kpi-strip';
import type { CapturaKpiData } from './components/captura-kpi-strip';
import { CapturaFilterBar } from './components/captura-filter-bar';
import type { CapturaFilters } from './components/captura-filter-bar';
import { CapturaGlassList } from './components/captura-glass-list';
import { CapturaGlassCards } from './components/captura-glass-cards';
import { CapturaDialog } from './components/captura-dialog';
import { AgendamentoDialog } from './components/agendamento-dialog';
import { TribunaisDialog } from './components/tribunais/tribunais-dialog';
import { CredenciaisAdvogadoDialog } from './components/advogados/credenciais-advogado-dialog';
import { AdvogadoCombobox } from '@/app/(authenticated)/captura';
import { useAdvogados, type Advogado } from '@/app/(authenticated)/advogados';

// Sub-tab content (existing components, will be refactored in later tasks)
import CredenciaisClient from './credenciais/page-client';
import TribunaisClient from './tribunais/page-client';
import AgendamentosClient from './agendamentos/page-client';

// --- Constants ---

type CapturaTab = 'historico' | 'agendamentos' | 'credenciais' | 'tribunais';

const TABS: TabPillOption[] = [
  { id: 'historico', label: 'Histórico' },
  { id: 'agendamentos', label: 'Agendamentos' },
  { id: 'credenciais', label: 'Credenciais' },
  { id: 'tribunais', label: 'Tribunais' },
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

  // Sub-tab dialog states
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [tribunalDialogOpen, setTribunalDialogOpen] = useState(false);
  const [selecionarAdvogadoDialog, setSelecionarAdvogadoDialog] = useState(false);
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<number | null>(null);
  const [credenciaisAdvogadoDialog, setCredenciaisAdvogadoDialog] = useState<{
    open: boolean;
    advogado: Advogado | null;
  }>({ open: false, advogado: null });

  // Advogados for credencial flow
  const { advogados: advogadosList, isLoading: advogadosLoading } = useAdvogados({ limite: 100 });

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

  const handleNovaCredencial = useCallback(() => {
    setSelectedAdvogadoId(null);
    setSelecionarAdvogadoDialog(true);
  }, []);

  const handleConfirmarAdvogado = useCallback(() => {
    if (!selectedAdvogadoId) return;
    const advogado = advogadosList.find((a) => a.id === selectedAdvogadoId);
    if (!advogado) return;
    setSelecionarAdvogadoDialog(false);
    setCredenciaisAdvogadoDialog({ open: true, advogado });
  }, [selectedAdvogadoId, advogadosList]);

  // Dynamic header button config per active tab
  const headerButtonConfig: Record<CapturaTab, { label: string; onClick: () => void }> = {
    historico: { label: 'Nova Captura', onClick: () => setCapturaDialogOpen(true) },
    agendamentos: { label: 'Novo Agendamento', onClick: () => setAgendamentoDialogOpen(true) },
    credenciais: { label: 'Nova Credencial', onClick: handleNovaCredencial },
    tribunais: { label: 'Nova Configuração', onClick: () => setTribunalDialogOpen(true) },
  };

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
          onClick={headerButtonConfig[activeTab].onClick}
        >
          <Plus className="size-3.5" />
          {headerButtonConfig[activeTab].label}
        </Button>
      </div>

      {/* Tab Pills */}
      <TabPills
        tabs={TABS}
        active={activeTab}
        onChange={handleTabChange}
      />

      {/* Histórico View */}
      {activeTab === 'historico' && (
        <>
          {/* KPI Strip */}
          <CapturaKpiStrip data={kpiData} />

          {/* Insight Banner */}
          {kpiData.falhas > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/15 bg-warning/5 px-4 py-2.5 text-xs text-warning">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                <strong>{kpiData.falhas}</strong> captura(s) falharam nos últimos 7 dias — verifique os logs para detalhes.
              </span>
            </div>
          )}

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

          {/* Content — Lista ou Cards */}
          {viewMode === 'lista' ? (
            <CapturaGlassList
              key={refreshKey}
              search={search}
              filters={filters}
              onKpiUpdate={setKpiData}
            />
          ) : (
            <CapturaGlassCards
              key={refreshKey}
              search={search}
              filters={filters}
              onKpiUpdate={setKpiData}
            />
          )}
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

      {/* Agendamento Dialog */}
      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setAgendamentoDialogOpen(false);
        }}
      />

      {/* Tribunais Dialog */}
      <TribunaisDialog
        tribunal={null}
        open={tribunalDialogOpen}
        onOpenChange={setTribunalDialogOpen}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setTribunalDialogOpen(false);
        }}
      />

      {/* Selecionar Advogado Dialog (for credencial flow) */}
      <Dialog
        open={selecionarAdvogadoDialog}
        onOpenChange={setSelecionarAdvogadoDialog}
      >
        <DialogContent className="sm:max-w-112.5">
          <DialogHeader>
            <DialogTitle>Nova Credencial</DialogTitle>
            <DialogDescription>
              Selecione o advogado para cadastrar credenciais de acesso aos tribunais.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-2">
              <Label>Advogado</Label>
              <AdvogadoCombobox
                advogados={advogadosList}
                selectedId={selectedAdvogadoId}
                onSelectionChange={setSelectedAdvogadoId}
                isLoading={advogadosLoading}
                placeholder="Selecione um advogado..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelecionarAdvogadoDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAdvogado}
              disabled={!selectedAdvogadoId}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credenciais Advogado Dialog */}
      <CredenciaisAdvogadoDialog
        open={credenciaisAdvogadoDialog.open}
        onOpenChangeAction={(open) =>
          setCredenciaisAdvogadoDialog({ ...credenciaisAdvogadoDialog, open })
        }
        advogado={credenciaisAdvogadoDialog.advogado}
        onRefreshAction={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
