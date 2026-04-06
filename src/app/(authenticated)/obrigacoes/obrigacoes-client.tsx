'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CalendarRange, Calendar, List, Sparkles, Settings, Plus } from 'lucide-react';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ObrigacoesKpiStrip } from './components/obrigacoes-kpi-strip';
import { ObrigacoesListaView } from './components/views/obrigacoes-lista-view';
import type { POCAcordo } from './components/obrigacao-list-row';

export type ObrigacoesViewMode = 'quadro' | 'semana' | 'mes' | 'ano' | 'lista';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', icon: Sparkles, label: 'Painel' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'mes', icon: CalendarRange, label: 'Mês' },
  { id: 'ano', icon: Calendar, label: 'Ano' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// Dados Mock da POC
const mockObrigacoes: POCAcordo[] = [
  { id: 1, descricao: 'Honorários Periciais', processoNumero: '009923-11.2024', valorOriginal: 4800, data: '28/10/2023', status: 'pendente', direcao: 'pagar' },
  { id: 2, descricao: 'Custas Finais', processoNumero: '004218-92.2023', valorOriginal: 12450, data: '15/10/2023', status: 'atrasada', direcao: 'pagar' },
  { id: 3, descricao: 'Seguro de Garantia', processoNumero: '001156-45.2023', valorOriginal: 2100, data: '12/10/2023', status: 'quitada', direcao: 'pagar' },
  { id: 4, descricao: 'Condenação Danos Morais', processoNumero: '229923-11.2025', valorOriginal: 48000, data: '01/11/2023', status: 'pendente', direcao: 'receber' },
];

export function ObrigacoesClient() {
  const router = useRouter();
  
  // View State
  const [viewMode, setViewMode] = useState<ObrigacoesViewMode>('lista');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Tabs
  const statusTabs: TabPillOption[] = [
    { id: 'todas', label: 'Todas', count: mockObrigacoes.length },
    { id: 'pendentes', label: 'Pendentes', count: 2 },
    { id: 'atrasadas', label: 'Atrasadas', count: 1 },
    { id: 'quitadas', label: 'Quitadas', count: 1 },
  ];

  const filteredData = mockObrigacoes.filter(ob => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'pendentes') return ob.status === 'pendente';
    if (activeTab === 'atrasadas') return ob.status === 'atrasada';
    if (activeTab === 'quitadas') return ob.status === 'quitada';
    return true;
  });

  const subtitle = `${mockObrigacoes.length} obrigação(ões) · 1 atrasada`;

  return (
    <TooltipProvider>
      <div className="max-w-350 mx-auto space-y-5">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-page-title">Obrigações</h1>
            <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
          </div>
          <div className="relative flex items-center justify-end gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Configurações"
            className="flex items-center justify-center size-9 rounded-xl border border-border/20 bg-card hover:bg-muted-foreground/5 transition-colors cursor-pointer shadow-sm"
          >
            <Settings className="size-4 text-muted-foreground" />
          </button>
          
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
            <Plus className="size-3.5" />
            Nova Obrigação
          </button>
        </div>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────── */}
        <ObrigacoesKpiStrip 
          totalPagar={14200}
          totalReceber={28950}
          totalAtrasadas={3}
          totalQuitadas={4}
        />

        {/* ── View Controls ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TabPills tabs={statusTabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar processo, descrição..."
            />
            <ViewToggle
              mode={viewMode}
              onChange={(val) => setViewMode(val as ObrigacoesViewMode)}
              options={VIEW_OPTIONS}
            />
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        
        {viewMode === 'lista' && (
          <ObrigacoesListaView 
             obrigacoes={filteredData}
             search={search}
          />
        )}
        
        {viewMode !== 'lista' && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-border/15 rounded-2xl bg-surface-container-low/20 border-dashed">
            <Calendar className="size-8 text-muted-foreground/45 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/50">Esta visualização ainda não possui mockup</p>
            <p className="text-xs text-muted-foreground/55 mt-1">
              Altere para "Lista"
            </p>
          </div>
        )}

      </div>
    </TooltipProvider>
  );
}
