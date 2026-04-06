/**
 * AudienciasMissionView — "Mission Control" para audiências (Glass Briefing)
 * ============================================================================
 * Segue o padrão de layout do ContratosClient:
 * - Single column flow com max-w-350
 * - KPI Strip no topo
 * - Hero card (MissionCard ou PostHearingFlow)
 * - InsightBanners contextuais
 * - View controls (TabPills + Search + ViewToggle)
 * - Content: Timeline (missão) ou Lista
 * - Sidebar: RhythmStrip + LoadHeatmap
 *
 * Trata audiências como MISSÕES — com countdown, readiness e debrief.
 * ============================================================================
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import {
  parseISO,
  isSameDay,
  format,
  differenceInMinutes,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gavel,
  Clock,
  Sun,
  Sunset,
  Moon,
  Video,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Target,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GlassPanel,
  InsightBanner,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';

import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { MissionCard } from './mission-card';
import { PostHearingFlow } from './post-hearing-flow';
import { AudienciaListRow } from './audiencia-list-row';
import { RhythmStrip } from './rhythm-strip';
import { LoadHeatmap } from './load-heatmap';
import { calcPrepItems, calcPrepScore } from './prep-score';
import { HearingCountdown } from './hearing-countdown';
import { Heading } from '@/components/ui/typography';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasMissionViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  onEdit?: (audiencia: Audiencia) => void;
  onNewAudiencia?: () => void;
  /** Map de responsavelId -> nome */
  responsavelNomes?: Map<number, string>;
}

type ContentView = 'missao' | 'lista';

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '—';
  }
}

function getBufferMinutes(prevEnd: string, nextStart: string): number {
  try {
    return differenceInMinutes(parseISO(nextStart), parseISO(prevEnd));
  } catch {
    return 0;
  }
}

function getBufferLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Constants ────────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'missao', icon: Target, label: 'Missão' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasMissionView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  onEdit: _onEdit,
  onNewAudiencia,
  responsavelNomes,
}: AudienciasMissionViewProps) {
  const now = useMemo(() => new Date(), []);
  const [contentView, setContentView] = useState<ContentView>('missao');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todas');

  // ── Filtered data ───────────────────────────────────────────────────────

  const dayAudiencias = useMemo(
    () =>
      audiencias
        .filter((a) => {
          try {
            return isSameDay(parseISO(a.dataInicio), currentDate);
          } catch {
            return false;
          }
        })
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    [audiencias, currentDate],
  );

  const filteredAudiencias = useMemo(() => {
    let list = contentView === 'missao' ? dayAudiencias : audiencias;

    if (activeTab !== 'todas') {
      const statusMap: Record<string, string> = {
        marcada: StatusAudiencia.Marcada,
        finalizada: StatusAudiencia.Finalizada,
      };
      const targetStatus = statusMap[activeTab];
      if (targetStatus) {
        list = list.filter((a) => a.status === targetStatus);
      }
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.poloAtivoNome ?? '').toLowerCase().includes(s) ||
          (a.poloPassivoNome ?? '').toLowerCase().includes(s) ||
          (a.numeroProcesso ?? '').includes(s) ||
          (a.tipoDescricao ?? '').toLowerCase().includes(s),
      );
    }

    return list;
  }, [contentView, dayAudiencias, audiencias, activeTab, search]);

  // ── Stats ───────────────────────────────────────────────────────────────

  const marcadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Marcada);
  const finalizadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada);
  const totalMarcadas = audiencias.filter((a) => a.status === StatusAudiencia.Marcada).length;
  const totalFinalizadas = audiencias.filter((a) => a.status === StatusAudiencia.Finalizada).length;

  const statusTabs: TabPillOption[] = useMemo(() => [
    { id: 'todas', label: 'Todas', count: contentView === 'missao' ? dayAudiencias.length : audiencias.length },
    { id: 'marcada', label: 'Marcadas', count: contentView === 'missao' ? marcadas.length : totalMarcadas },
    { id: 'finalizada', label: 'Realizadas', count: contentView === 'missao' ? finalizadas.length : totalFinalizadas },
  ], [contentView, dayAudiencias.length, audiencias.length, marcadas.length, finalizadas.length, totalMarcadas, totalFinalizadas]);

  // Next upcoming
  const nextAudiencia = useMemo(
    () => marcadas.find((a) => { try { return parseISO(a.dataFim) > now; } catch { return false; } }) ?? null,
    [marcadas, now],
  );

  // Most recently completed (for post-hearing flow)
  const lastCompleted = useMemo(() => {
    const pastToday = dayAudiencias
      .filter((a) => {
        try {
          return parseISO(a.dataFim) <= now && a.status !== StatusAudiencia.Cancelada;
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.dataFim.localeCompare(a.dataFim));
    return pastToday[0] ?? null;
  }, [dayAudiencias, now]);

  // Low prep warnings
  const lowPrepAudiencias = useMemo(
    () => marcadas.filter((a) => calcPrepScore(calcPrepItems(a)) < 50),
    [marcadas],
  );

  // ── Date navigation ─────────────────────────────────────────────────────

  const handlePrev = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const handleNext = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const handleToday = useCallback(() => onDateChange(new Date()), [onDateChange]);

  const isCurrentDay = isToday(currentDate);
  const dateLabel = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  // ── Timeline sections ───────────────────────────────────────────────────

  const morning = filteredAudiencias.filter((a) => {
    try { return parseISO(a.dataInicio).getHours() < 12; } catch { return false; }
  });
  const afternoon = filteredAudiencias.filter((a) => {
    try {
      const h = parseISO(a.dataInicio).getHours();
      return h >= 12 && h < 18;
    } catch { return false; }
  });
  const evening = filteredAudiencias.filter((a) => {
    try { return parseISO(a.dataInicio).getHours() >= 18; } catch { return false; }
  });

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Audiências</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {dayAudiencias.length} hoje · {totalMarcadas} marcada{totalMarcadas !== 1 ? 's' : ''} no período
          </p>
        </div>
        {onNewAudiencia && (
          <button
            onClick={onNewAudiencia}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            Nova audiência
          </button>
        )}
      </div>

      {/* ── Date Navigator (only in mission view) ──────────── */}
      {contentView === 'missao' && (
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={handleToday}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
              isCurrentDay ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
            )}
          >
            Hoje
          </button>
          <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronRight className="size-4" />
          </button>
          <span className="text-sm font-medium capitalize ml-1">{dateLabel}</span>
        </div>
      )}

      {/* ── Hero Card ──────────────────────────────────────── */}
      {contentView === 'missao' && nextAudiencia && (
        <MissionCard
          audiencia={nextAudiencia}
          onOpenProcess={(id) => {
            window.location.href = `/app/processos/${id}`;
          }}
          onViewChecklist={(a) => onViewDetail(a)}
        />
      )}

      {contentView === 'missao' && !nextAudiencia && lastCompleted && lastCompleted.status !== StatusAudiencia.Finalizada && (
        <PostHearingFlow audiencia={lastCompleted} />
      )}

      {/* ── Insight Banners ────────────────────────────────── */}
      {lowPrepAudiencias.length > 0 && (
        <InsightBanner type="warning">
          {lowPrepAudiencias.length} audiência{lowPrepAudiencias.length > 1 ? 's' : ''} com
          preparo abaixo de 50% — revise antes do horário
        </InsightBanner>
      )}

      {/* ── View Controls ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills tabs={statusTabs} active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar parte, processo, tipo..."
          />
          <ViewToggle
            mode={contentView}
            onChange={(m) => setContentView(m as ContentView)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}

      {contentView === 'missao' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline (2/3) */}
          <div className="lg:col-span-2">
            <GlassPanel className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-3 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium text-muted-foreground/50">Timeline do dia</span>
                </div>
                <span className="text-[9px] tabular-nums text-muted-foreground/50">
                  {filteredAudiencias.length} audiência{filteredAudiencias.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredAudiencias.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="size-8 text-muted-foreground/10 mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground/55">Nenhuma audiência neste dia</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {morning.length > 0 && (
                    <>
                      <TimelineSectionHeader label="Manhã" icon={Sun} />
                      {morning.map((a, i) => (
                        <div key={a.id}>
                          <TimelineAudienciaCard audiencia={a} onClick={() => onViewDetail(a)} />
                          {i < morning.length - 1 && (() => {
                            const buffer = getBufferMinutes(a.dataFim, morning[i + 1].dataInicio);
                            return buffer > 0 && buffer < 180 ? (
                              <TimelineBuffer label={`${getBufferLabel(buffer)} buffer`} />
                            ) : null;
                          })()}
                        </div>
                      ))}
                    </>
                  )}

                  {morning.length > 0 && afternoon.length > 0 && (
                    <div className="flex items-center gap-2 py-3 px-2">
                      <div className="flex-1 h-px bg-border/8" />
                      <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Intervalo</span>
                      <div className="flex-1 h-px bg-border/8" />
                    </div>
                  )}

                  {afternoon.length > 0 && (
                    <>
                      <TimelineSectionHeader label="Tarde" icon={Sunset} />
                      {afternoon.map((a, i) => (
                        <div key={a.id}>
                          <TimelineAudienciaCard audiencia={a} onClick={() => onViewDetail(a)} />
                          {i < afternoon.length - 1 && (() => {
                            const buffer = getBufferMinutes(a.dataFim, afternoon[i + 1].dataInicio);
                            return buffer > 0 && buffer < 180 ? (
                              <TimelineBuffer label={`${getBufferLabel(buffer)} buffer`} />
                            ) : null;
                          })()}
                        </div>
                      ))}
                    </>
                  )}

                  {evening.length > 0 && (
                    <>
                      <TimelineSectionHeader label="Noite" icon={Moon} />
                      {evening.map((a) => (
                        <TimelineAudienciaCard key={a.id} audiencia={a} onClick={() => onViewDetail(a)} />
                      ))}
                    </>
                  )}

                  {finalizadas.length > 0 && activeTab === 'todas' && (
                    <>
                      <div className="flex items-center gap-2 py-2 mt-2">
                        <div className="flex-1 h-px bg-border/8" />
                        <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Concluídas</span>
                        <div className="flex-1 h-px bg-border/8" />
                      </div>
                      {finalizadas.map((a) => (
                        <PostHearingFlow key={a.id} audiencia={a} className="mb-2" />
                      ))}
                    </>
                  )}
                </div>
              )}
            </GlassPanel>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-4">
            <RhythmStrip audiencias={audiencias} />
            <LoadHeatmap audiencias={audiencias} responsavelNomes={responsavelNomes} />
          </div>
        </div>
      )}

      {contentView === 'lista' && (
        <div className="flex flex-col gap-1">
          {filteredAudiencias.length > 0 ? (
            filteredAudiencias.map((a) => (
              <AudienciaListRow key={a.id} audiencia={a} onClick={onViewDetail} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gavel className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">Nenhuma audiência encontrada</p>
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
// INTERNAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function TimelineSectionHeader({ label, icon: Icon }: { label: string; icon: typeof Sun }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Icon className="size-3 text-muted-foreground/40" />
      <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

function TimelineBuffer({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-16">
      <div className="w-px h-4 bg-border/10 ml-0.5" />
      <span className="text-[8px] text-muted-foreground/35">{label}</span>
    </div>
  );
}

function TimelineAudienciaCard({ audiencia, onClick }: { audiencia: Audiencia; onClick: () => void }) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const ModalIcon = audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida' ? Video : Building2;
  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      {/* Time column */}
      <div className="w-12 shrink-0 flex flex-col items-end pt-2.5">
        <span className={cn(
          'text-[11px] tabular-nums font-medium',
          isPast ? 'text-muted-foreground/55' : 'text-foreground/60',
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
          isOngoing ? 'bg-success animate-pulse' : isPast ? 'bg-muted-foreground/20' : 'bg-primary/50',
        )} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 rounded-xl p-3 transition-all duration-200 min-w-0 text-left cursor-pointer',
          'border border-border/12 hover:border-border/20 hover:shadow-sm hover:scale-[1.005]',
          isPast && 'opacity-50',
          isOngoing && 'ring-1 ring-success/20 border-success/15',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Gavel className="size-3 text-primary/40 shrink-0" />
              <h3 className="text-[13px] font-medium text-foreground truncate">
                {audiencia.tipoDescricao || 'Audiência'}
              </h3>
              {isOngoing && <span className="text-[8px] font-semibold text-success px-1.5 py-px rounded-full bg-success/10">Agora</span>}
              {/* Prep Badge */}
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold tabular-nums shrink-0',
                prepStatus === 'good' ? 'bg-success/10 text-success' :
                prepStatus === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive',
              )}>
                {prepStatus === 'good' ? <CheckCircle2 className="size-2" /> : <AlertTriangle className="size-2" />}
                {prepScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums mt-0.5 block">
              {audiencia.numeroProcesso}
            </span>
          </div>

          {/* Countdown for upcoming */}
          {!isPast && !isOngoing && (
            <HearingCountdown targetDate={parseISO(audiencia.dataInicio)} compact />
          )}
        </div>

        {/* Parties */}
        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-5">
            {audiencia.poloAtivoNome || '–'} <span className="text-muted-foreground/45">vs</span> {audiencia.poloPassivoNome || '–'}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2 ml-5 flex-wrap">
          <div className="flex items-center gap-1">
            <ModalIcon className="size-2 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/55">
              {audiencia.modalidade === 'presencial' ? 'Presencial' : audiencia.modalidade === 'hibrida' ? 'Híbrida' : 'Virtual'}
            </span>
          </div>
          {audiencia.trt && (
            <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
          )}
          {audiencia.urlAudienciaVirtual && (audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && (
            <a
              href={audiencia.urlAudienciaVirtual}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] font-semibold px-1.5 py-px rounded bg-info/8 text-info/50 hover:bg-info/15 transition-colors"
            >
              Entrar na sala
            </a>
          )}
        </div>
      </button>
    </div>
  );
}
