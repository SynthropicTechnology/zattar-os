/**
 * ExpedientesSemanaView — Week view com cards agrupados por dia
 * ============================================================================
 * Apresentação visual: cards em colunas por dia da semana, com GlassPanel.
 * Segue o mesmo padrão visual de AudienciasSemanaView.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import type { Expediente } from '../domain';
import {
  getExpedienteUrgencyLevel,
  getExpedientePartyNames,
  GRAU_TRIBUNAL_LABELS,
  type UrgencyLevel,
} from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ExpedientesSemanaViewProps {
  expedientes: Expediente[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (expediente: Expediente) => void;
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  tiposExpedientesData?: { id: number; tipoExpediente?: string }[];
}

// ─── Urgency visual mappings ─────────────────────────────────────────────

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-destructive/70',
  alto: 'border-l-warning/60',
  medio: 'border-l-primary/50',
  baixo: 'border-l-success/40',
  ok: 'border-l-border/30',
};

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive',
  alto: 'bg-warning',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/30',
};

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive/15 text-destructive',
  alto: 'bg-warning/15 text-warning',
  medio: 'bg-info/15 text-info',
  baixo: 'bg-success/15 text-success',
  ok: 'bg-muted/30 text-muted-foreground/50',
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function getCountdownLabel(exp: Expediente): string | null {
  if (!exp.dataPrazoLegalParte) return null;
  if (exp.baixadoEm) return null;
  const dias = differenceInDays(parseISO(exp.dataPrazoLegalParte), new Date());
  return `${dias}d`;
}

// ─── Component ───────────────────────────────────────────────────────────

export function ExpedientesSemanaView({
  expedientes,
  currentDate,
  onDateChange,
  onViewDetail,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesSemanaViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekDays = useMemo(
    () =>
      eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
        (d) => d.getDay() !== 0 && d.getDay() !== 6,
      ),
    [weekStart, weekEnd],
  );

  // ─── Lookup maps ────────────────────────────────────────────────────────

  const usuariosMap = useMemo(() => {
    const m = new Map<number, string>();
    (usuariosData ?? []).forEach((u) =>
      m.set(u.id, u.nomeExibicao || u.nomeCompleto || `User ${u.id}`),
    );
    return m;
  }, [usuariosData]);

  const tiposMap = useMemo(() => {
    const m = new Map<number, string>();
    (tiposExpedientesData ?? []).forEach((t) =>
      m.set(t.id, t.tipoExpediente || `Tipo ${t.id}`),
    );
    return m;
  }, [tiposExpedientesData]);

  // ─── Group expedientes by day ───────────────────────────────────────────

  const expedientesByDay = useMemo(() => {
    const map = new Map<string, Expediente[]>();
    const urgencyOrder: Record<UrgencyLevel, number> = {
      critico: 0,
      alto: 1,
      medio: 2,
      baixo: 3,
      ok: 4,
    };

    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dayExps = expedientes
        .filter((e) => {
          if (!e.dataPrazoLegalParte) return false;
          try {
            return isSameDay(parseISO(e.dataPrazoLegalParte), day);
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const ua = getExpedienteUrgencyLevel(a);
          const ub = getExpedienteUrgencyLevel(b);
          return (
            (urgencyOrder[ua] - urgencyOrder[ub]) ||
            a.numeroProcesso.localeCompare(b.numeroProcesso)
          );
        });
      map.set(key, dayExps);
    });
    return map;
  }, [expedientes, weekDays]);

  // ─── Navigation handlers ────────────────────────────────────────────────

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  const handleToday = () => onDateChange(new Date());

  const isCurrentWeek = weekDays.some((d) => isToday(d));
  const friday = weekDays[weekDays.length - 1];
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(friday, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevWeek}
          className="p-1.5 rounded-lg hover:bg-foreground/[0.04] transition-colors text-muted-foreground/55 cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentWeek
              ? 'bg-primary/12 text-primary'
              : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button
          onClick={handleNextWeek}
          className="p-1.5 rounded-lg hover:bg-foreground/[0.04] transition-colors text-muted-foreground/55 cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{weekLabel}</span>
      </div>

      {/* Week Grid — 5 colunas (seg-sex) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayExps = expedientesByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <GlassPanel
              key={key}
              depth={today ? 2 : 1}
              className="p-4 min-h-40"
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      today ? 'text-primary' : 'text-muted-foreground/55',
                    )}
                  >
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      today
                        ? 'bg-primary text-primary-foreground size-6 rounded-full flex items-center justify-center text-[11px]'
                        : 'text-foreground/80',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                {dayExps.length > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground/45 font-medium">
                    {dayExps.length}
                  </span>
                )}
              </div>

              {/* Expedientes */}
              {dayExps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6">
                  <span className="text-xs text-muted-foreground/30">—</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayExps.map((exp) => (
                    <WeekDayCard
                      key={exp.id}
                      expediente={exp}
                      onClick={() => onViewDetail(exp)}
                      usuariosMap={usuariosMap}
                      tiposMap={tiposMap}
                    />
                  ))}
                </div>
              )}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

// ─── Internal: Week Day Card ─────────────────────────────────────────────

function WeekDayCard({
  expediente,
  onClick,
  usuariosMap,
  tiposMap,
}: {
  expediente: Expediente;
  onClick: () => void;
  usuariosMap: Map<number, string>;
  tiposMap: Map<number, string>;
}) {
  const urgency = getExpedienteUrgencyLevel(expediente);
  const partes = getExpedientePartyNames(expediente);
  const isBaixado = !!expediente.baixadoEm;
  const countdownLabel = getCountdownLabel(expediente);

  const tipoName = expediente.tipoExpedienteId
    ? tiposMap.get(expediente.tipoExpedienteId) ?? 'Sem tipo'
    : 'Sem tipo';

  const responsavelName = expediente.responsavelId
    ? usuariosMap.get(expediente.responsavelId) ?? null
    : null;

  const prazoLabel = expediente.dataPrazoLegalParte
    ? format(parseISO(expediente.dataPrazoLegalParte), 'dd/MM')
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'w-full text-left p-3 rounded-xl border border-l-[3px] transition-all duration-200 cursor-pointer',
        'bg-card/80 border-border/40 hover:border-border/60 hover:shadow-sm hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
        isBaixado && 'opacity-60',
      )}
    >
      {/* Row 1: Prazo date + Urgency indicators */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs tabular-nums font-semibold text-foreground/80">
          {prazoLabel ?? <span className="italic text-muted-foreground/40">Sem prazo</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {!isBaixado && urgency !== 'ok' && (
            <span className={cn('size-2 rounded-full', URGENCY_DOT[urgency])} />
          )}
          {countdownLabel && (
            <span
              className={cn(
                'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
                URGENCY_BADGE[urgency],
              )}
            >
              {countdownLabel}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Tipo expediente */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <p
          className={cn(
            'text-xs font-medium text-foreground truncate',
            isBaixado && 'line-through',
          )}
        >
          {tipoName}
        </p>
      </div>

      {/* Row 3: Partes */}
      {(partes.autora || partes.re) && (
        <p className="text-[10px] text-muted-foreground/55 mt-1 truncate">
          {partes.autora || '—'}{' '}
          <span className="text-muted-foreground/35">vs</span>{' '}
          {partes.re || '—'}
        </p>
      )}

      {/* Row 4: TRT + Grau + Processo */}
      <div className="flex items-center gap-1.5 mt-1 min-w-0">
        {expediente.trt && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 shrink-0">
            {expediente.trt}
          </span>
        )}
        {expediente.grau && (
          <span className="text-[9px] text-muted-foreground/45 shrink-0">
            {GRAU_TRIBUNAL_LABELS[expediente.grau]}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60 tabular-nums truncate">
          {expediente.numeroProcesso}
        </span>
      </div>

      {/* Row 5: Orgao julgador */}
      {(expediente.orgaoJulgadorOrigem || expediente.descricaoOrgaoJulgador) && (
        <p
          className="text-[9px] text-muted-foreground/45 mt-0.5 truncate"
          title={expediente.orgaoJulgadorOrigem || expediente.descricaoOrgaoJulgador || undefined}
        >
          {expediente.orgaoJulgadorOrigem || expediente.descricaoOrgaoJulgador}
        </p>
      )}

      {/* Row 6: Descricao arquivos */}
      {expediente.descricaoArquivos && (
        <p
          className="text-[9px] text-muted-foreground/40 mt-1 truncate italic"
          title={expediente.descricaoArquivos}
        >
          {expediente.descricaoArquivos}
        </p>
      )}

      {/* Row 7: Responsavel footer */}
      <div className="flex justify-end mt-2">
        {responsavelName ? (
          <span className="text-[9px] text-muted-foreground/55">
            {responsavelName}
          </span>
        ) : (
          <span className="text-[9px] italic text-warning/60">Sem resp.</span>
        )}
      </div>
    </div>
  );
}
