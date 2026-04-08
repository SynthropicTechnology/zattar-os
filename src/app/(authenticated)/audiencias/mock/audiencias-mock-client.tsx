'use client';

/**
 * AudienciasMockClient — Mock completo do módulo de Audiências
 * ============================================================================
 * Segue a estética "Glass Briefing" de contratos: single-column flow,
 * GlassPanel containers, KPI strip, hero card, timeline, list rows.
 * Todos os dados são mocados em TypeScript para aprovação de design.
 * ============================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Gavel,
  Video,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertTriangle,
  FileText,
  ExternalLink,
  Users,
  Handshake,
  XCircle,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  CalendarDays,
  List,
  BarChart3,
  ArrowRight,
  Zap,
  Target,
  ShieldCheck,
} from 'lucide-react';
import {
  GlassPanel,
  Sparkline,
  AnimatedNumber,
  CalendarHeatmap,
  InsightBanner,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

interface MockAudiencia {
  id: number;
  tipo: string;
  modalidade: 'virtual' | 'presencial' | 'hibrida';
  status: 'marcada' | 'finalizada' | 'cancelada';
  dataInicio: Date;
  dataFim: Date;
  numeroProcesso: string;
  trt: string;
  grau: string;
  poloAtivo: string;
  poloPassivo: string;
  responsavel: string;
  responsavelId: number;
  urlVirtual?: string;
  sala?: string;
  observacoes?: string;
  ataId?: number;
  prepScore: number;
  prepItems: { label: string; done: boolean }[];
}

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

function makeDate(hoursFromNow: number): Date {
  return new Date(NOW.getTime() + hoursFromNow * 60 * 60 * 1000);
}

function makeDateFixed(hour: number, minute: number): Date {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), hour, minute);
}

const MOCK_AUDIENCIAS: MockAudiencia[] = [
  {
    id: 1,
    tipo: 'Instrução e Julgamento',
    modalidade: 'virtual',
    status: 'finalizada',
    dataInicio: makeDateFixed(9, 0),
    dataFim: makeDateFixed(10, 30),
    numeroProcesso: '0001234-56.2024.5.01.0001',
    trt: 'TRT1',
    grau: '1º Grau',
    poloAtivo: 'João Silva dos Santos',
    poloPassivo: 'Empresa Alpha Logística Ltda',
    responsavel: 'Dra. Carolina Mendes',
    responsavelId: 1,
    urlVirtual: 'https://pje.trt1.jus.br/sala/12345',
    prepScore: 100,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: true },
      { label: 'Tipo definido', done: true },
      { label: 'Link da sala virtual', done: true },
      { label: 'Ata anterior disponível', done: true },
    ],
    observacoes: 'Testemunha confirmada. Documentos juntados em 28/03.',
    ataId: 42,
  },
  {
    id: 2,
    tipo: 'Conciliação',
    modalidade: 'virtual',
    status: 'marcada',
    dataInicio: makeDate(1.5),
    dataFim: makeDate(2.5),
    numeroProcesso: '0005678-90.2024.5.01.0003',
    trt: 'TRT1',
    grau: '1º Grau',
    poloAtivo: 'Maria Costa Ferreira',
    poloPassivo: 'Tech Solutions S/A',
    responsavel: 'Dra. Carolina Mendes',
    responsavelId: 1,
    urlVirtual: 'https://pje.trt1.jus.br/sala/67890',
    prepScore: 72,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: true },
      { label: 'Tipo definido', done: true },
      { label: 'Link da sala virtual', done: true },
      { label: 'Ata anterior disponível', done: false },
    ],
    observacoes: 'Cliente quer acordo de até R$ 45.000. Empresa sinalizou abertura.',
  },
  {
    id: 3,
    tipo: 'Instrução',
    modalidade: 'presencial',
    status: 'marcada',
    dataInicio: makeDate(4),
    dataFim: makeDate(5.5),
    numeroProcesso: '0009012-34.2023.5.02.0015',
    trt: 'TRT2',
    grau: '1º Grau',
    poloAtivo: 'Pedro Oliveira Lima',
    poloPassivo: 'Construções Beta Engenharia',
    responsavel: 'Dr. Rafael Souza',
    responsavelId: 2,
    sala: '5ª Vara do Trabalho - Sala 302',
    prepScore: 45,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: false },
      { label: 'Tipo definido', done: true },
      { label: 'Endereço presencial', done: true },
      { label: 'Ata anterior disponível', done: false },
    ],
  },
  {
    id: 4,
    tipo: 'Julgamento',
    modalidade: 'hibrida',
    status: 'marcada',
    dataInicio: makeDate(6),
    dataFim: makeDate(7),
    numeroProcesso: '0003456-78.2024.5.01.0007',
    trt: 'TRT1',
    grau: '2º Grau',
    poloAtivo: 'Ana Beatriz Cardoso',
    poloPassivo: 'Varejo Gama Comércio',
    responsavel: 'Dra. Carolina Mendes',
    responsavelId: 1,
    urlVirtual: 'https://pje.trt1.jus.br/sala/34567',
    sala: '2ª Turma - Sala Virtual + Presencial',
    prepScore: 88,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: true },
      { label: 'Tipo definido', done: true },
      { label: 'Link da sala virtual', done: true },
      { label: 'Endereço presencial', done: true },
      { label: 'Ata anterior disponível', done: false },
    ],
    observacoes: 'Recurso ordinário. Revisar acórdão de 1º grau.',
  },
  {
    id: 5,
    tipo: 'Una',
    modalidade: 'virtual',
    status: 'marcada',
    dataInicio: new Date(TODAY.getTime() + 86400000 + 10 * 3600000), // amanhã 10h
    dataFim: new Date(TODAY.getTime() + 86400000 + 11.5 * 3600000),
    numeroProcesso: '0007890-12.2024.5.03.0010',
    trt: 'TRT3',
    grau: '1º Grau',
    poloAtivo: 'Lucas Pereira Neto',
    poloPassivo: 'Indústria Delta Metalúrgica',
    responsavel: 'Dr. Rafael Souza',
    responsavelId: 2,
    urlVirtual: 'https://pje.trt3.jus.br/sala/78901',
    prepScore: 25,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: false },
      { label: 'Tipo definido', done: true },
      { label: 'Link da sala virtual', done: false },
      { label: 'Ata anterior disponível', done: false },
    ],
  },
  {
    id: 6,
    tipo: 'Conciliação',
    modalidade: 'virtual',
    status: 'marcada',
    dataInicio: new Date(TODAY.getTime() + 2 * 86400000 + 14 * 3600000), // depois de amanhã 14h
    dataFim: new Date(TODAY.getTime() + 2 * 86400000 + 15 * 3600000),
    numeroProcesso: '0002345-67.2024.5.01.0012',
    trt: 'TRT1',
    grau: '1º Grau',
    poloAtivo: 'Fernanda Rocha',
    poloPassivo: 'Transportes Epsilon',
    responsavel: 'Dra. Carolina Mendes',
    responsavelId: 1,
    urlVirtual: 'https://pje.trt1.jus.br/sala/23456',
    prepScore: 60,
    prepItems: [
      { label: 'Responsável designado', done: true },
      { label: 'Observações registradas', done: true },
      { label: 'Tipo definido', done: true },
      { label: 'Link da sala virtual', done: false },
      { label: 'Ata anterior disponível', done: false },
    ],
  },
];

const MOCK_WEEK_HEATMAP = [
  0, 2, 1, 3, 0, 0, 0,
  1, 0, 2, 1, 3, 0, 0,
  0, 3, 0, 4, 1, 0, 0,
  2, 1, 3, 0, 2, 0, 0,
  1, 0, 2, 1, 0, 0, 0,
];

const MOCK_TREND = [3, 5, 4, 7, 6, 8, 5, 9, 7, 8, 6, 10];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getTimeUntil(target: Date): { label: string; totalMs: number } {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { label: 'Agora', totalMs: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (hours > 0) return { label: `${hours}h ${minutes}min`, totalMs: diff };
  return { label: `${minutes}min`, totalMs: diff };
}

function getUrgencyLevel(totalMs: number): 'critico' | 'alto' | 'medio' | 'baixo' | 'ok' {
  if (totalMs <= 0) return 'ok';
  if (totalMs <= 15 * 60 * 1000) return 'critico';
  if (totalMs <= 60 * 60 * 1000) return 'alto';
  if (totalMs <= 3 * 60 * 60 * 1000) return 'medio';
  return 'baixo';
}

function getPrepStatus(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'danger';
}

const PREP_COLORS = {
  good: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
};

const MODALIDADE_ICON = {
  virtual: Video,
  presencial: Building2,
  hibrida: Sparkles,
} as const;

const MODALIDADE_LABEL = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// VIEW OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

type ViewMode = 'missao' | 'lista';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'missao', icon: Target, label: 'Missão' },
  { id: 'lista', icon: List, label: 'Lista' },
];

const STATUS_TABS: TabPillOption[] = [
  { id: 'todas', label: 'Todas', count: 6 },
  { id: 'marcada', label: 'Marcadas', count: 5 },
  { id: 'finalizada', label: 'Realizadas', count: 1 },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AudienciasMockClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('missao');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [, setTick] = useState(0);

  // Tick every 30s for countdown updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Filter
  const filtered = useMemo(() => {
    return MOCK_AUDIENCIAS.filter((a) => {
      if (activeTab !== 'todas' && a.status !== activeTab) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.poloAtivo.toLowerCase().includes(s) ||
          a.poloPassivo.toLowerCase().includes(s) ||
          a.numeroProcesso.includes(s) ||
          a.tipo.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [activeTab, search]);

  // Stats
  const todayAudiencias = MOCK_AUDIENCIAS.filter(
    (a) => a.dataInicio.toDateString() === TODAY.toDateString(),
  );
  const marcadas = todayAudiencias.filter((a) => a.status === 'marcada');
  const nextAudiencia = marcadas.find((a) => a.dataFim > NOW);
  const lastFinished = todayAudiencias.find((a) => a.status === 'finalizada');
  const avgPrep = Math.round(
    MOCK_AUDIENCIAS.reduce((acc, a) => acc + a.prepScore, 0) / MOCK_AUDIENCIAS.length,
  );

  // Conflict: audiencias 2 and 3 overlap check (simulated)
  const hasConflict = marcadas.length >= 2;

  // Low prep audiencias
  const lowPrepAudiencias = MOCK_AUDIENCIAS.filter(
    (a) => a.status === 'marcada' && a.prepScore < 50,
  );

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Audiências</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {todayAudiencias.length} hoje · {MOCK_AUDIENCIAS.filter((a) => a.status === 'marcada').length} marcadas esta semana
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          <Plus className="size-3.5" />
          Nova audiência
        </button>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────── */}
      <MissionKpiStrip
        totalSemana={MOCK_AUDIENCIAS.filter((a) => a.status === 'marcada').length}
        nextAudiencia={nextAudiencia}
        realizadasMes={142}
        totalMes={158}
        avgPrep={avgPrep}
        trend={MOCK_TREND}
      />

      {/* ── Hero: Next Mission or Post-Hearing ──────────────────── */}
      {viewMode === 'missao' && nextAudiencia && (
        <MissionHeroCard audiencia={nextAudiencia} />
      )}

      {viewMode === 'missao' && !nextAudiencia && lastFinished && (
        <PostHearingCard audiencia={lastFinished} />
      )}

      {/* ── Insight Banners ─────────────────────────────────────── */}
      {lowPrepAudiencias.length > 0 && (
        <InsightBanner type="warning">
          {lowPrepAudiencias.length} audiência{lowPrepAudiencias.length > 1 ? 's' : ''} com
          preparo abaixo de 50% — revise antes do horário
        </InsightBanner>
      )}

      {hasConflict && (
        <InsightBanner type="alert">
          Possível sobrecarga: {todayAudiencias.length} audiências agendadas hoje
        </InsightBanner>
      )}

      {/* ── View Controls ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar parte, processo, tipo..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={(m) => setViewMode(m as ViewMode)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}

      {viewMode === 'missao' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline (2/3) */}
          <div className="lg:col-span-2">
            <DayTimeline audiencias={filtered} />
          </div>
          {/* Sidebar (1/3) */}
          <div className="space-y-4">
            <RhythmStrip heatmap={MOCK_WEEK_HEATMAP} />
            <LoadDistribution audiencias={MOCK_AUDIENCIAS} />
          </div>
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="flex flex-col gap-1">
          {filtered.map((a) => (
            <AudienciaListRow key={a.id} audiencia={a} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gavel className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">
                Nenhuma audiência encontrada
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

// ═══════════════════════════════════════════════════════════════════════════
// MISSION KPI STRIP
// ═══════════════════════════════════════════════════════════════════════════

function MissionKpiStrip({
  totalSemana,
  nextAudiencia,
  realizadasMes,
  totalMes,
  avgPrep,
  trend,
}: {
  totalSemana: number;
  nextAudiencia?: MockAudiencia;
  realizadasMes: number;
  totalMes: number;
  avgPrep: number;
  trend: number[];
}) {
  const taxaRealizacao = totalMes > 0 ? Math.round((realizadasMes / totalMes) * 100) : 0;
  const timeUntil = nextAudiencia ? getTimeUntil(nextAudiencia.dataInicio) : null;
  const prepColor = PREP_COLORS[getPrepStatus(avgPrep)];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* ── Semana ─────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Semana
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={totalSemana} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">audiências</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <CalendarDays className="size-4 text-primary/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={trend} width={80} height={16} />
          <span className="text-[9px] text-success/60 font-medium">+18%</span>
        </div>
      </GlassPanel>

      {/* ── Próxima ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Próxima
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {timeUntil?.label ?? '—'}
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <Clock className="size-4 text-warning/50" />
          </div>
        </div>
        <div className="mt-2.5">
          {nextAudiencia ? (
            <span className="text-[9px] text-muted-foreground/50 truncate block">
              {nextAudiencia.trt} · {MODALIDADE_LABEL[nextAudiencia.modalidade]}
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground/30">Nenhuma agendada</span>
          )}
        </div>
      </GlassPanel>

      {/* ── Realizadas ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Realizadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={realizadasMes} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">/ {totalMes} mês</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4 text-success/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${taxaRealizacao}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {taxaRealizacao}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Preparo ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Preparo
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {avgPrep}%
              </p>
              <span className="text-[10px] text-muted-foreground/40">média</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4 text-primary/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${avgPrep}%`, backgroundColor: prepColor, opacity: 0.3 }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {avgPrep}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MISSION HERO CARD
// ═══════════════════════════════════════════════════════════════════════════

function MissionHeroCard({ audiencia }: { audiencia: MockAudiencia }) {
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const timeUntil = getTimeUntil(audiencia.dataInicio);
  const urgency = getUrgencyLevel(timeUntil.totalMs);
  const _prepStatus = getPrepStatus(audiencia.prepScore);
  const ModalIcon = MODALIDADE_ICON[audiencia.modalidade];
  const isOngoing = audiencia.dataInicio <= NOW && audiencia.dataFim >= NOW;

  // Countdown display
  const diff = audiencia.dataInicio.getTime() - Date.now();
  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((diff / 1000) % 60));
  const pad = (n: number) => String(n).padStart(2, '0');

  const urgencyTextColor = {
    critico: 'text-destructive',
    alto: 'text-warning',
    medio: 'text-primary',
    baixo: 'text-primary/70',
    ok: 'text-muted-foreground/55',
  }[urgency];

  const urgencyBg = {
    critico: 'bg-destructive/8',
    alto: 'bg-warning/8',
    medio: 'bg-primary/6',
    baixo: 'bg-primary/4',
    ok: 'bg-muted-foreground/5',
  }[urgency];

  const actions = [
    ...(audiencia.urlVirtual
      ? [{ label: 'Entrar na sala', icon: Video, primary: isOngoing }]
      : []),
    { label: 'Ver processo', icon: FileText, primary: false },
    { label: 'Abrir PJe', icon: ExternalLink, primary: false },
    { label: 'Checklist', icon: Users, primary: false },
  ];

  return (
    <GlassPanel depth={3} className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gavel className="size-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/60">
                  {isOngoing ? 'Em andamento' : 'Próxima missão'}
                </span>
                {isOngoing && <span className="size-1.5 rounded-full bg-success animate-pulse" />}
              </div>
              <h3 className="text-base font-heading font-semibold tracking-tight mt-0.5">
                {audiencia.tipo}
              </h3>
            </div>
          </div>

          {/* Countdown */}
          {diff > 0 && (
            <div className={cn('inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg', urgencyBg)}>
              <div className="flex items-center gap-0.5 tabular-nums">
                {hours > 0 && (
                  <>
                    <span className={cn('text-sm font-bold', urgencyTextColor)}>{pad(hours)}</span>
                    <span className="text-[9px] text-muted-foreground/55">:</span>
                  </>
                )}
                <span className={cn('text-sm font-bold', urgencyTextColor)}>{pad(minutes)}</span>
                <span className="text-[9px] text-muted-foreground/55">:</span>
                <span className={cn('text-sm font-bold', urgencyTextColor)}>{pad(seconds)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <InfoCell label="Horário" value={`${fmtTime(audiencia.dataInicio)} – ${fmtTime(audiencia.dataFim)}`} />
          <InfoCell label="Tribunal" value={`${audiencia.trt} · ${audiencia.grau}`} />
          <InfoCell label="Processo" value={audiencia.numeroProcesso} mono />
          <InfoCell
            label="Modalidade"
            value={MODALIDADE_LABEL[audiencia.modalidade]}
            icon={ModalIcon}
          />
        </div>

        {/* Parties */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-border/5">
          <span className="text-[10px] text-foreground/60 truncate">{audiencia.poloAtivo}</span>
          <span className="text-[9px] text-muted-foreground/50 shrink-0">vs</span>
          <span className="text-[10px] text-foreground/60 truncate">{audiencia.poloPassivo}</span>
        </div>

        {/* Bottom: PrepScore + Actions */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <PrepRing score={audiencia.prepScore} size={48} />
            <div className="space-y-0.5">
              {audiencia.prepItems.slice(0, 3).map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {item.done ? (
                    <CheckCircle2 className="size-2.5 text-success/60 shrink-0" />
                  ) : (
                    <Circle className="size-2.5 text-muted-foreground/45 shrink-0" />
                  )}
                  <span className={cn(
                    'text-[10px] truncate',
                    item.done ? 'text-muted-foreground/50 line-through' : 'text-foreground/70',
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
              {audiencia.prepItems.length > 3 && (
                <span className="text-[9px] text-muted-foreground/55">
                  +{audiencia.prepItems.length - 3} itens
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {actions.map((action) => (
              <button
                key={action.label}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer group',
                  action.primary
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-foreground/[0.04]',
                )}
              >
                <action.icon className="size-2.5" />
                <span className="hidden sm:inline">{action.label}</span>
                <ArrowRight className="size-2 opacity-0 group-hover:opacity-40 transition-opacity hidden sm:block" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// POST-HEARING CARD
// ═══════════════════════════════════════════════════════════════════════════

function PostHearingCard({ audiencia }: { audiencia: MockAudiencia }) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const minsSinceEnd = Math.round((Date.now() - audiencia.dataFim.getTime()) / 60000);
  const elapsedLabel = minsSinceEnd < 60
    ? `${minsSinceEnd}min`
    : `${Math.floor(minsSinceEnd / 60)}h ${minsSinceEnd % 60}min`;
  const urgencyColor = minsSinceEnd < 60 ? 'text-success/50' : minsSinceEnd < 240 ? 'text-warning/60' : 'text-destructive/60';

  const results = [
    { value: 'acordo', label: 'Acordo', icon: Handshake },
    { value: 'sem_acordo', label: 'Sem acordo', icon: XCircle },
    { value: 'redesignada', label: 'Redesignada', icon: RefreshCw },
  ];

  const postActions = [
    { id: 'result', label: 'Registrar resultado', done: !!selectedResult },
    { id: 'ata', label: 'Upload da ata', done: !!audiencia.ataId },
    { id: 'notify', label: 'Notificar cliente', done: false },
  ];
  const completed = postActions.filter((a) => a.done).length;
  const progress = Math.round((completed / postActions.length) * 100);

  return (
    <GlassPanel depth={1} className="relative overflow-hidden">
      <div className="h-px bg-linear-to-r from-transparent via-warning/20 to-transparent" />
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-warning/50" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-warning/60">Concluída</span>
            <span className="text-[10px] text-muted-foreground/55">
              {audiencia.tipo} · {fmtTime(audiencia.dataFim)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={cn('size-2.5', urgencyColor)} />
            <span className={cn('text-[10px] tabular-nums font-medium', urgencyColor)}>
              há {elapsedLabel}
            </span>
          </div>
        </div>

        {/* Process */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">{audiencia.numeroProcesso}</span>
          <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
        </div>

        {/* Parties */}
        <p className="text-[10px] text-foreground/50 mb-4 truncate">
          {audiencia.poloAtivo} <span className="text-muted-foreground/50">vs</span> {audiencia.poloPassivo}
        </p>

        {/* Result Selector */}
        <div className="mb-4">
          <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Resultado</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            {results.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedResult(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer',
                  selectedResult === opt.value
                    ? 'border-primary/30 bg-primary/8 text-primary'
                    : 'border-border/15 text-muted-foreground/50 hover:text-foreground/70 hover:border-border/25',
                )}
              >
                <opt.icon className="size-3" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Ações pós-audiência</span>
            <span className="text-[9px] tabular-nums text-muted-foreground/55">{completed}/{postActions.length}</span>
          </div>
          <div className="h-0.5 rounded-full bg-border/8 overflow-hidden mb-2">
            <div className="h-full rounded-full bg-success/50 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="space-y-0.5">
            {postActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all',
                  action.done ? 'text-muted-foreground/55' : 'text-foreground/60 hover:bg-foreground/[0.04] cursor-pointer',
                )}
              >
                {action.done ? (
                  <CheckCircle2 className="size-3 text-success/50 shrink-0" />
                ) : (
                  <Circle className="size-3 text-muted-foreground/45 shrink-0" />
                )}
                <span className={action.done ? 'line-through' : ''}>{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

function DayTimeline({ audiencias }: { audiencias: MockAudiencia[] }) {
  const today = audiencias.filter(
    (a) => a.dataInicio.toDateString() === TODAY.toDateString(),
  );
  const future = audiencias.filter(
    (a) => a.dataInicio.toDateString() !== TODAY.toDateString(),
  );

  const morning = today.filter((a) => a.dataInicio.getHours() < 12);
  const afternoon = today.filter((a) => {
    const h = a.dataInicio.getHours();
    return h >= 12 && h < 18;
  });
  const evening = today.filter((a) => a.dataInicio.getHours() >= 18);

  return (
    <GlassPanel className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="size-3 text-muted-foreground/50" />
          <span className="text-[11px] font-medium text-muted-foreground/50">Timeline do dia</span>
        </div>
        <span className="text-[9px] tabular-nums text-muted-foreground/50 capitalize">
          {fmtDate(TODAY)}
        </span>
      </div>

      {today.length === 0 && future.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarDays className="size-8 text-muted-foreground/10 mx-auto mb-2" />
          <p className="text-[11px] text-muted-foreground/55">Nenhuma audiência neste dia</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Morning */}
          {morning.length > 0 && (
            <>
              <TimelineSectionHeader label="Manhã" icon={Sun} />
              {morning.map((a, i) => (
                <div key={a.id}>
                  <TimelineCard audiencia={a} />
                  {i < morning.length - 1 && <TimelineBuffer />}
                </div>
              ))}
            </>
          )}

          {/* Lunch break */}
          {morning.length > 0 && afternoon.length > 0 && (
            <div className="flex items-center gap-2 py-3 px-2">
              <div className="flex-1 h-px bg-border/8" />
              <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Intervalo</span>
              <div className="flex-1 h-px bg-border/8" />
            </div>
          )}

          {/* Afternoon */}
          {afternoon.length > 0 && (
            <>
              <TimelineSectionHeader label="Tarde" icon={Sunset} />
              {afternoon.map((a, i) => (
                <div key={a.id}>
                  <TimelineCard audiencia={a} />
                  {i < afternoon.length - 1 && <TimelineBuffer />}
                </div>
              ))}
            </>
          )}

          {/* Evening */}
          {evening.length > 0 && (
            <>
              <TimelineSectionHeader label="Noite" icon={Moon} />
              {evening.map((a) => (
                <TimelineCard key={a.id} audiencia={a} />
              ))}
            </>
          )}

          {/* Upcoming (not today) */}
          {future.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-3 mt-2">
                <div className="flex-1 h-px bg-border/8" />
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Próximos dias</span>
                <div className="flex-1 h-px bg-border/8" />
              </div>
              {future.map((a) => (
                <TimelineCard key={a.id} audiencia={a} showDate />
              ))}
            </>
          )}
        </div>
      )}
    </GlassPanel>
  );
}

function TimelineSectionHeader({ label, icon: Icon }: { label: string; icon: typeof Sun }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Icon className="size-3 text-muted-foreground/40" />
      <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

function TimelineBuffer() {
  return (
    <div className="flex items-center gap-2 py-1 pl-12">
      <div className="w-px h-4 bg-border/10 ml-0.5" />
      <span className="text-[8px] text-muted-foreground/35">~30min buffer</span>
    </div>
  );
}

function TimelineCard({ audiencia, showDate }: { audiencia: MockAudiencia; showDate?: boolean }) {
  const isPast = audiencia.dataFim < NOW;
  const isOngoing = audiencia.dataInicio <= NOW && audiencia.dataFim >= NOW;
  const isFinalizada = audiencia.status === 'finalizada';
  const timeUntil = getTimeUntil(audiencia.dataInicio);
  const urgency = getUrgencyLevel(timeUntil.totalMs);
  const prepStatus = getPrepStatus(audiencia.prepScore);
  const ModalIcon = MODALIDADE_ICON[audiencia.modalidade];

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      {/* Time column */}
      <div className="w-12 shrink-0 flex flex-col items-end pt-2.5">
        {showDate && (
          <span className="text-[8px] text-muted-foreground/40 mb-0.5">
            {audiencia.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
        <span className={cn(
          'text-[11px] tabular-nums font-medium',
          isPast || isFinalizada ? 'text-muted-foreground/55' : 'text-foreground/60',
        )}>
          {fmtTime(audiencia.dataInicio)}
        </span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">
          {fmtTime(audiencia.dataFim)}
        </span>
      </div>

      {/* Dot + line */}
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn(
          'size-2 rounded-full',
          isOngoing ? 'bg-success animate-pulse' :
          isFinalizada ? 'bg-success/50' :
          isPast ? 'bg-muted-foreground/20' :
          'bg-primary/50',
        )} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 rounded-xl p-3 transition-all duration-200 min-w-0 cursor-pointer',
        'border border-border/12 hover:border-border/20 hover:shadow-sm hover:scale-[1.005]',
        (isPast || isFinalizada) && 'opacity-55',
        isOngoing && 'ring-1 ring-success/20 border-success/15',
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Gavel className="size-3 text-primary/40 shrink-0" />
              <h3 className="text-[13px] font-medium text-foreground truncate">{audiencia.tipo}</h3>
              {isOngoing && (
                <span className="text-[8px] font-semibold text-success px-1.5 py-px rounded-full bg-success/10">Agora</span>
              )}
              {isFinalizada && (
                <span className="text-[8px] font-semibold text-success/60 px-1.5 py-px rounded-full bg-success/8">Realizada</span>
              )}
              {/* Prep Badge */}
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold tabular-nums shrink-0',
                prepStatus === 'good' ? 'bg-success/10 text-success' :
                prepStatus === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive',
              )}>
                {prepStatus === 'good' ? <CheckCircle2 className="size-2" /> : <AlertTriangle className="size-2" />}
                {audiencia.prepScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums mt-0.5 block">
              {audiencia.numeroProcesso}
            </span>
          </div>

          {/* Countdown */}
          {!isPast && !isOngoing && !isFinalizada && (
            <span className={cn(
              'text-[11px] tabular-nums font-semibold shrink-0',
              urgency === 'critico' ? 'text-destructive' :
              urgency === 'alto' ? 'text-warning' :
              'text-primary/70',
            )}>
              {timeUntil.label}
            </span>
          )}
        </div>

        {/* Parties */}
        <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-5">
          {audiencia.poloAtivo} <span className="text-muted-foreground/45">vs</span> {audiencia.poloPassivo}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2 ml-5 flex-wrap">
          <div className="flex items-center gap-1">
            <ModalIcon className="size-2 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/55">{MODALIDADE_LABEL[audiencia.modalidade]}</span>
          </div>
          <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
          {audiencia.urlVirtual && (audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && (
            <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-info/8 text-info/50 hover:bg-info/15 transition-colors cursor-pointer">
              Entrar na sala
            </span>
          )}
          {audiencia.responsavel && (
            <span className="text-[8px] px-1.5 py-px rounded bg-border/8 text-muted-foreground/40">
              {audiencia.responsavel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST ROW
// ═══════════════════════════════════════════════════════════════════════════

function AudienciaListRow({ audiencia }: { audiencia: MockAudiencia }) {
  const isPast = audiencia.dataFim < NOW;
  const isFinalizada = audiencia.status === 'finalizada';
  const _prepStatus = getPrepStatus(audiencia.prepScore);
  const ModalIcon = MODALIDADE_ICON[audiencia.modalidade];
  const timeUntil = getTimeUntil(audiencia.dataInicio);

  const statusColor = isFinalizada
    ? 'bg-success/50'
    : audiencia.status === 'cancelada'
    ? 'bg-destructive/50'
    : isPast
    ? 'bg-muted-foreground/20'
    : 'bg-primary/50';

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all outline-none',
      'focus-visible:ring-1 focus-visible:ring-primary/30 hover:bg-foreground/[0.04]',
      (isPast || isFinalizada) && 'opacity-55',
    )}>
      {/* Status dot */}
      <div className={cn('size-2.5 rounded-full shrink-0', statusColor)} />

      {/* Icon */}
      <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Gavel className="size-3.5 text-primary/50" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{audiencia.tipo}</p>
        <p className="text-[10px] text-muted-foreground/30 truncate">
          {audiencia.poloAtivo} vs {audiencia.poloPassivo}
        </p>
      </div>

      {/* Date/Time */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-[10px] font-medium tabular-nums">
          {audiencia.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </p>
        <p className="text-[9px] text-muted-foreground/40 tabular-nums">
          {fmtTime(audiencia.dataInicio)}
        </p>
      </div>

      {/* Modalidade */}
      <div className="flex items-center gap-1 shrink-0 md:flex w-20">
        <ModalIcon className="size-2.5 text-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground/50">{MODALIDADE_LABEL[audiencia.modalidade]}</span>
      </div>

      {/* TRT */}
      <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40 shrink-0 hidden md:block">
        {audiencia.trt}
      </span>

      {/* Prep */}
      <div className="shrink-0 w-10 flex justify-center">
        <PrepRing score={audiencia.prepScore} size={28} />
      </div>

      {/* Countdown or status */}
      <span className={cn(
        'text-[9px] shrink-0 w-16 text-right tabular-nums font-medium',
        isFinalizada ? 'text-success/50' :
        !isPast ? (timeUntil.totalMs <= 60 * 60 * 1000 ? 'text-warning/60' : 'text-muted-foreground/40') :
        'text-muted-foreground/25',
      )}>
        {isFinalizada ? 'Realizada' : !isPast ? timeUntil.label : 'Passada'}
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RHYTHM STRIP (Heatmap Sidebar)
// ═══════════════════════════════════════════════════════════════════════════

function RhythmStrip({ heatmap }: { heatmap: number[] }) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-3 text-primary/40" />
        <span className="text-[11px] font-medium text-muted-foreground/50">Ritmo de audiências</span>
      </div>
      <CalendarHeatmap data={heatmap} colorScale="primary" />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[8px] text-muted-foreground/40">Menos</span>
        <div className="flex gap-0.5">
          {['bg-border/10', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map((c, i) => (
            <div key={i} className={cn('size-2.5 rounded-[2px]', c)} />
          ))}
        </div>
        <span className="text-[8px] text-muted-foreground/40">Mais</span>
      </div>
    </GlassPanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD DISTRIBUTION (Sidebar)
// ═══════════════════════════════════════════════════════════════════════════

function LoadDistribution({ audiencias }: { audiencias: MockAudiencia[] }) {
  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    audiencias.forEach((a) => counts.set(a.tipo, (counts.get(a.tipo) || 0) + 1));
    const total = audiencias.length || 1;
    return Array.from(counts.entries())
      .map(([tipo, count]) => ({ tipo, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [audiencias]);

  const byResponsavel = useMemo(() => {
    const counts = new Map<string, number>();
    audiencias.forEach((a) => counts.set(a.responsavel, (counts.get(a.responsavel) || 0) + 1));
    const maxCount = Math.max(...Array.from(counts.values()), 1);
    return Array.from(counts.entries())
      .map(([nome, count]) => ({ nome, count, percent: Math.round((count / maxCount) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [audiencias]);

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-3 text-primary/40" />
          <span className="text-[11px] font-medium text-muted-foreground/50">Por tipo</span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 ml-auto">{audiencias.length} total</span>
        </div>
        <div className="space-y-2">
          {byType.map((item) => (
            <div key={item.tipo}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[10px] text-foreground/60 truncate max-w-[60%]">{item.tipo}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold tabular-nums">{item.count}</span>
                  <span className="text-[8px] text-muted-foreground/50 tabular-nums">{item.percent}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div className="h-full rounded-full bg-primary/30 transition-all duration-700" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-3 text-primary/40" />
          <span className="text-[11px] font-medium text-muted-foreground/50">Carga por advogado</span>
        </div>
        <div className="space-y-2">
          {byResponsavel.map((item) => (
            <div key={item.nome}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[10px] text-foreground/60 truncate max-w-[60%]">{item.nome}</span>
                <span className="text-[10px] font-bold tabular-nums">{item.count}</span>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    item.percent > 80 ? 'bg-destructive/40' : item.percent > 50 ? 'bg-warning/40' : 'bg-success/40',
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function PrepRing({ score, size = 36 }: { score: number; size?: number }) {
  const status = getPrepStatus(score);
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/15" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={PREP_COLORS[status]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          'font-bold tabular-nums',
          size <= 32 ? 'text-[8px]' : 'text-[10px]',
          status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive',
        )}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: typeof Video;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground/60" />}
        <span className={cn(
          'text-sm font-medium truncate',
          mono && 'text-[11px] font-mono text-foreground/70 tabular-nums',
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}
