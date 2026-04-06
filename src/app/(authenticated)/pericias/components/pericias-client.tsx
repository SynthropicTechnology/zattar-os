'use client';

/**
 * PericiasClient — Componente unificado do módulo Perícias
 * ============================================================================
 * Segue o padrão AudienciasClient: single-column Glass Briefing layout com
 * header, KPI strip, insight banners, view controls e content switcher.
 * ============================================================================
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  CalendarDays, Settings, List, Sparkles, User, Star, 
  Clock, AlertTriangle, ChevronRight, Calculator, Activity, Stethoscope, Hammer, Briefcase
} from 'lucide-react';

import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { StatusAudiencia } from '@/app/(authenticated)/audiencias'; // Reusable concepts when possible
import { usePericias } from '../hooks/use-pericias';
import { SituacaoPericiaCodigo, type Pericia } from '../domain';

import { getSemanticBadgeVariant } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type ViewMode = 'quadro' | 'semana' | 'lista';

const VIEW_ROUTES: Record<ViewMode, string> = {
  quadro: '/pericias/quadro',
  semana: '/pericias/semana',
  lista: '/pericias/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewMode> = {
  '/pericias': 'quadro',
  '/pericias/quadro': 'quadro',
  '/pericias/semana': 'semana',
  '/pericias/lista': 'lista',
};

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', icon: Sparkles, label: 'Missão' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

// Mocks complementares para a experiência de UI/UX Analytics
function getRandomScore(seed: number) {
  const rs = Math.sin(seed) * 10000;
  return rs - Math.floor(rs);
}

function calcPeritoInsights(idStr: string | number) {
  const num = typeof idStr === 'number' ? idStr : parseInt(String(idStr).replace(/\D/g, '') || '0');
  const rating = (3.5 + (getRandomScore(num) * 1.5)).toFixed(1);
  const winRate = Math.floor(40 + (getRandomScore(num + 1) * 55));
  const missingDeposit = getRandomScore(num + 2) > 0.7; // 30% chance missing deposit
  const honorarios = `R$ ${(Math.floor(10 + getRandomScore(num + 3) * 50) * 100).toLocaleString('pt-BR')},00`;
  return { rating, winRate, missingDeposit, honorarios };
}

function getIconByEspecialidade(desc?: string) {
  const norm = (desc || '').toLowerCase();
  if (norm.includes('médic') || norm.includes('insalubridade')) return Activity;
  if (norm.includes('psicólog') || norm.includes('saúde')) return Stethoscope;
  if (norm.includes('engenhari') || norm.includes('periculosidade')) return Hammer;
  if (norm.includes('contábil') || norm.includes('contador')) return Calculator;
  return Briefcase;
}

function getEtapaFromSituacao(codigo: SituacaoPericiaCodigo) {
  switch (codigo) {
    case SituacaoPericiaCodigo.AGUARDANDO_LAUDO: return 1;
    case SituacaoPericiaCodigo.LAUDO_JUNTADO: return 3;
    case SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS: return 3.5;
    case SituacaoPericiaCodigo.FINALIZADA: return 4;
    case SituacaoPericiaCodigo.CANCELADA: return 0;
    default: return 1;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PericiasClientProps {
  initialView?: ViewMode;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PericiasClient({ initialView = 'quadro' }: PericiasClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<ViewMode>(viewFromUrl);

  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== viewMode) setViewMode(newView as ViewMode);
  }, [pathname, viewMode]);

  const handleViewChange = useCallback((value: string) => {
    const target = value as ViewMode;
    const route = VIEW_ROUTES[target];
    if (route && route !== pathname) router.push(route);
    setViewMode(target);
  }, [pathname, router]);

  // Shared state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ativas');

  // Fetching data
  // Para manter a strip KPI atualizada dinamicamente com filtros tabs cross,
  // trazemos um limite maior. Numa aplicação real sever-side pagination seria gerida aqui.
  const { pericias: allPericias, isLoading, error } = usePericias({
    limite: 100, // Fetch top 100 for Dashboard display logic
    busca: search || undefined
  });

  // Derived Metrics
  const metrics = useMemo(() => {
    let totalDepositados = 0;
    let totalPendentes = 0;
    let winCount = 0;
    let prazosCriticos = 0;

    const noPrazos = new Date();
    noPrazos.setDate(noPrazos.getDate() + 7);

    allPericias.forEach(p => {
      const insights = calcPeritoInsights(p.id);
      const val = parseInt(insights.honorarios.replace(/\D/g, '')) / 100;
      if (insights.missingDeposit) {
        totalPendentes += val;
      } else {
        totalDepositados += val;
      }
      if (insights.winRate > 60) winCount++;
      if (p.prazoEntrega && new Date(p.prazoEntrega) <= noPrazos) {
        prazosCriticos++;
      }
    });

    const winR = allPericias.length ? Math.round((winCount / allPericias.length) * 100) : 0;

    return { 
      ativas: allPericias.filter(p => p.situacaoCodigo !== SituacaoPericiaCodigo.FINALIZADA && p.situacaoCodigo !== SituacaoPericiaCodigo.CANCELADA).length, 
      pendentes: totalPendentes, 
      winRate: winR, 
      criticos: prazosCriticos 
    };
  }, [allPericias]);

  const totalFinalizadas = allPericias.filter(p => p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA).length;
  const totalLaudo = allPericias.filter(p => p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO).length;

  const tabOptions: TabPillOption[] = [
    { id: 'ativas', label: 'Todas Ativas', count: metrics.ativas },
    { id: 'aguardando', label: 'Aguardando Laudo', count: totalLaudo },
    { id: 'finalizadas', label: 'Finalizadas', count: totalFinalizadas },
  ];

  const filteredPericias = useMemo(() => {
    if (activeTab === 'aguardando') return allPericias.filter(p => p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO);
    if (activeTab === 'finalizadas') return allPericias.filter(p => p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA);
    return allPericias.filter(p => p.situacaoCodigo !== SituacaoPericiaCodigo.FINALIZADA && p.situacaoCodigo !== SituacaoPericiaCodigo.CANCELADA);
  }, [allPericias, activeTab]);

  return (
    <TooltipProvider>
      <div className="max-w-350 mx-auto space-y-5">
        
        {/* --- HEADER --- */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight">Perícias (Visão Estratégica)</h1>
            <p className="text-sm text-muted-foreground/50 mt-0.5">Gerenciamento técnico, financeiro e temporal de peritos judiciais.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-card">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações de Tipos e Peritos</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* --- KPI STRIP --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Perícias Ativas</span>
            <span className="text-2xl font-semibold font-mono">{metrics.ativas}</span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Honorários Pendentes</span>
            <span className="text-2xl font-semibold font-mono text-orange-500">
              R$ {metrics.pendentes.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Taxa de Favorabilidade</span>
            <span className="text-2xl font-semibold font-mono text-emerald-500">{metrics.winRate}%</span>
          </div>
          <div className="bg-card border border-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prazos Críticos (7d)</span>
            <span className="text-2xl font-semibold font-mono text-red-500">{metrics.criticos}</span>
          </div>
        </div>

        {/* --- DYNAMIC ALERT BANNER --- */}
        {!isLoading && metrics.pendentes > 0 && (
          <InsightBanner type="warning">
            <strong>Atenção:</strong> Há honorários pendentes correndo risco de preclusão. Confirme os depósitos!
          </InsightBanner>
        )}

        {error && (
          <InsightBanner type="alert">{error}</InsightBanner>
        )}

        {/* --- VIEW CONTROLS --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TabPills tabs={tabOptions} active={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar processo ou perito..." />
            <ViewToggle mode={viewMode} onChange={handleViewChange} options={VIEW_OPTIONS} />
          </div>
        </div>

        {/* --- CONTENT --- */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (viewMode === 'quadro' || viewMode === 'semana') && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredPericias.map(pericia => {
              const insights = calcPeritoInsights(pericia.id);
              const etapa = getEtapaFromSituacao(pericia.situacaoCodigo);
              const Icone = getIconByEspecialidade(pericia.especialidade?.descricao);
              const urgente = pericia.prioridadeProcessual || insights.missingDeposit;

              return (
                <div key={pericia.id} className="bg-card border border-border/20 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
                  
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                         <Icone className="w-5 h-5" />
                       </div>
                       <div>
                         <h3 className="font-mono text-sm tracking-tight">{pericia.numeroProcesso || pericia.processo?.numeroProcesso}</h3>
                         <span className="text-xs text-muted-foreground">{pericia.especialidade?.descricao || 'Perícia Técnica'}</span>
                       </div>
                    </div>
                    {urgente && (
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-red-500/10 text-destructive rounded font-bold flex items-center gap-1 border border-destructive/20">
                        <AlertTriangle className="w-3 h-3" /> Urgente
                      </span>
                    )}
                  </div>

                  {/* Perfil do Perito Analítico */}
                  <div className="bg-white/5 border border-border/10 rounded-xl p-3 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/20">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pericia.perito?.nome || 'Perito Judicial (A Definir)'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center tracking-tight font-medium text-foreground">
                            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" /> {insights.rating}
                          </span>
                          <span>•</span>
                          <span className={insights.winRate > 50 ? 'text-emerald-500 font-medium' : 'text-orange-500 font-medium'}>
                            Tese: {insights.winRate}% Freq
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium mb-0.5">Honorários</p>
                      <p className={`text-sm font-mono tracking-tight font-medium ${insights.missingDeposit ? 'text-destructive' : 'text-foreground'}`}>
                        {insights.honorarios}
                      </p>
                    </div>
                  </div>

                  {/* Progressão Visual Timeline */}
                  <div className="py-2.5 bg-border/5 -mx-5 px-5 border-y border-border/5">
                    <p className="text-[11px] font-semibold mb-3 flex items-center justify-between uppercase tracking-wider">
                      <span className="text-muted-foreground/70">PROCESSO PERICIAL</span>
                      <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0 h-5 ${etapa === 4 ? 'border-primary/50 text-primary' : 'border-border/30 text-muted-foreground'}`}>
                        {pericia.situacaoDescricao || pericia.situacaoCodigo}
                      </Badge>
                    </p>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-1.5 mb-2.5 text-xs flex rounded-full bg-border/30">
                        <div style={{ width: `${(etapa / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-700 ease-out"></div>
                      </div>
                      <div className="flex justify-between text-[9px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/40 w-full px-0.5">
                        <span className={etapa >= 0 ? "text-primary/90" : ""}>Ordem</span>
                        <span className={etapa >= 1 ? "text-primary/90" : ""}>Quesitos</span>
                        <span className={etapa >= 2 ? "text-primary/90" : ""}>Vistoria</span>
                        <span className={etapa >= 3 ? "text-primary/90" : ""}>Laudo</span>
                        <span className={etapa >= 4 ? "text-primary/90" : ""}>Fim</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Dinâmico */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-muted/60 px-2.5 py-1.5 rounded-md text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Prazo: <span className="text-foreground tracking-tight">{pericia.prazoEntrega ? new Date(pericia.prazoEntrega).toLocaleDateString() : 'A Definir'}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-3 font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                      Gerenciar <ChevronRight className="w-3 h-3 ml-1.5 opacity-70" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {filteredPericias.length === 0 && (
              <div className="col-span-1 md:col-span-2 border border-dashed border-border/40 rounded-2xl p-12 flex flex-col items-center justify-center text-muted-foreground bg-border/5">
                <Sparkles className="w-8 h-8 mb-3 text-primary/30" />
                <p className="text-sm font-medium">Nenhuma perícia encontrada para esta visualização.</p>
              </div>
            )}
          </div>
        )}

        {!isLoading && viewMode === 'lista' && (
          <div className="border border-border/20 rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground bg-card">
            <List className="w-8 h-8 mb-3 text-primary/50" />
            <p className="text-sm font-medium">Renderização de DataTable via DataShell em desenvolvimento.</p>
            <p className="text-xs text-muted-foreground mt-1">Utilize a visão estratégica (Missão) para acompanhamento diário.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
