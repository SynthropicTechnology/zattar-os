'use client';

import { useState } from 'react';
import { 
  CalendarDays, Settings, List, Sparkles, User, Star, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, Calculator, Activity
} from 'lucide-react';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- MOCK DATA ---
const KPI_METRICS = {
  ativas: 42,
  honorariosDepositados: 12500,
  honorariosPendentes: 4500,
  winRate: 78
};

const TAB_OPTIONS = [
  { id: 'todas', label: 'Todas', count: 42 },
  { id: 'laudo', label: 'Aguardando Laudo', count: 15 },
  { id: 'esclarecimento', label: 'Aguardando Esclarecimento', count: 5 },
  { id: 'finalizada', label: 'Finalizadas', count: 156 },
];

const VIEW_OPTIONS = [
  { id: 'quadro', icon: Sparkles, label: 'Missão' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'lista', icon: List, label: 'Lista' },
];

const MOCK_PERICIAS = [
  {
    id: 1,
    numero: '0001234-56.2023.5.09.0012',
    tipo: 'Insalubridade',
    icone: Activity,
    statusEtapa: 3, // 0: Nomeação, 1: Quesitos, 2: Vistoria, 3: Laudo, 4: Conclusão
    statusTexto: 'Aguardando Laudo',
    prazo: '15 Mai 2024',
    perito: { nome: 'Dr. Roberto Santos', rating: 4.8, winRate: 82, honorarios: 'R$ 2.500', depositado: true },
    urgente: false
  },
  {
    id: 2,
    numero: '0009876-12.2023.5.09.0044',
    tipo: 'Contábil',
    icone: Calculator,
    statusEtapa: 1, 
    statusTexto: 'Quesitos Pendentes',
    prazo: '28 Abr 2024',
    perito: { nome: 'João Ferreira', rating: 3.5, winRate: 45, honorarios: 'R$ 4.000', depositado: false },
    urgente: true
  }
];

export function PericiasMockClient() {
  const [activeTab, setActiveTab] = useState('todas');
  const [viewMode, setViewMode] = useState('quadro');
  const [search, setSearch] = useState('');

  return (
    <TooltipProvider>
      <div className="max-w-350 mx-auto space-y-5">
        
        {/* --- CABEÇALHO --- */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight">Perícias (Visão Estratégica)</h1>
            <p className="text-sm text-muted-foreground/50 mt-0.5">Gerenciamento técnico, financeiro e temporal.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-card">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações de Perícia</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* --- KPI STRIP DISRUPTIVA --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Perícias Ativas</span>
            <span className="text-2xl font-semibold font-mono">{KPI_METRICS.ativas}</span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Honorários Pendentes</span>
            <span className="text-2xl font-semibold font-mono text-orange-500">R$ {KPI_METRICS.honorariosPendentes}</span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Taxa de Favorabilidade</span>
            <span className="text-2xl font-semibold font-mono text-emerald-500">{KPI_METRICS.winRate}%</span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prazos Críticos (7d)</span>
            <span className="text-2xl font-semibold font-mono text-red-500">3</span>
          </div>
        </div>

        {/* --- INSIGHT BANNERS --- */}
        <InsightBanner type="warning">
          <strong>Atenção:</strong> Há 1 perícia com prazo de impugnação de honorários vencendo amanhã.
        </InsightBanner>

        {/* --- VIEW CONTROLS --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TabPills tabs={TAB_OPTIONS} active={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar processo ou perito..." />
            <ViewToggle mode={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
          </div>
        </div>

        {/* --- CONTENT AREA (QUADRO) --- */}
        {viewMode === 'quadro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PERICIAS.map(pericia => (
              <div key={pericia.id} className="bg-card border border-border/20 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
                
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                     <div className="p-2 rounded-lg bg-primary/10 text-primary">
                       <pericia.icone className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-mono text-sm tracking-tight">{pericia.numero}</h3>
                       <span className="text-xs text-muted-foreground">{pericia.tipo}</span>
                     </div>
                  </div>
                  {pericia.urgente && (
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-red-500/10 text-red-500 rounded font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Urgente
                    </span>
                  )}
                </div>

                {/* Perfil do Perito */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pericia.perito.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" /> {pericia.perito.rating}</span>
                        <span>•</span>
                        <span className={pericia.perito.winRate > 50 ? 'text-emerald-500' : 'text-orange-500'}>Win: {pericia.perito.winRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Honorários</p>
                    <p className={`text-sm font-mono ${!pericia.perito.depositado ? 'text-red-400' : ''}`}>
                      {pericia.perito.honorarios}
                    </p>
                  </div>
                </div>

                {/* Timeline Visual Progress Bar */}
                <div className="py-2">
                  <p className="text-xs font-semibold mb-2 flex items-center justify-between">
                    <span>STATUS: <span className="text-primary">{pericia.statusTexto}</span></span>
                  </p>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-border">
                      <div style={{ width: `${(pericia.statusEtapa / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground/60 w-full px-1 mt-[-10px]">
                      <span className={pericia.statusEtapa >= 0 ? "text-primary font-medium" : ""}>Nomeação</span>
                      <span className={pericia.statusEtapa >= 1 ? "text-primary font-medium" : ""}>Quesitos</span>
                      <span className={pericia.statusEtapa >= 2 ? "text-primary font-medium" : ""}>Vistoria</span>
                      <span className={pericia.statusEtapa >= 3 ? "text-primary font-medium" : ""}>Laudo</span>
                      <span className={pericia.statusEtapa >= 4 ? "text-primary font-medium" : ""}>Fim</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="flex items-center justify-between pt-2 border-t border-border/10">
                  <div className="flex items-center gap-1.5 text-xs font-medium bg-muted/50 px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Prazo: <span className="text-foreground">{pericia.prazo}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-primary/10 hover:text-primary">
                    Detalhes <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="border border-dashed border-border/40 rounded-2xl p-5 flex flex-col items-center justify-center text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-border transition-all cursor-pointer">
              <Sparkles className="w-6 h-6 mb-2 text-primary/50" />
              <p className="text-sm font-medium">Nova Perícia a Cadastrar</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
