'use client';

/**
 * ExpedientesWeekMission — Briefing Diário (Week Mission View)
 * ============================================================================
 * Inspirado no AudienciasMissaoContent: timeline vertical com agrupamento
 * semântico por urgência, week strip com contagens, hero card contextual.
 *
 * Substitui a tabela da view de semana por uma experiência tipo "missão do dia".
 * ============================================================================
 */

import * as React from 'react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarClock,
  CircleDashed,
  FileText,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
import {
  AnimatedNumber,
  UrgencyDot,
  InsightBanner,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { AppBadge } from '@/components/ui/app-badge';
import { Heading } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';

import { GRAU_TRIBUNAL_LABELS, type Expediente } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export interface ExpedientesWeekMissionProps {
  weekNavigatorProps: Omit<WeekNavigatorProps, 'className' | 'variant'>;
  expedientes: Expediente[];
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getUsuarioNome(u: UsuarioData) {
  return u.nomeExibicao || u.nome_exibicao || u.nomeCompleto || u.nome || `Usuario ${u.id}`;
}

function calcularDiasRestantes(exp: Expediente): number | null {
  if (!exp.dataPrazoLegalParte) return null;
  const prazo = new Date(exp.dataPrazoLegalParte);
  const prazoZ = new Date(prazo.getFullYear(), prazo.getMonth(), prazo.getDate());
  const hoje = new Date();
  const hojeZ = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazoZ.getTime() - hojeZ.getTime()) / 86400000);
}

type Urgencia = 'urgente' | 'no_prazo' | 'sem_prazo' | 'baixado';

function classificarExpediente(exp: Expediente): Urgencia {
  if (exp.baixadoEm) return 'baixado';
  const dias = calcularDiasRestantes(exp);
  if (exp.prazoVencido || (dias !== null && dias < 0)) return 'urgente';
  if (dias === 0) return 'urgente';
  if (dias === null) return 'sem_prazo';
  return 'no_prazo';
}

function getDiasLabel(dias: number | null, vencido: boolean): string {
  if (dias === null) return 'Sem prazo';
  if (vencido || dias < 0) return `${Math.abs(dias)}d vencido`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanha';
  return `${dias}d restantes`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const SECTION_CONFIG: Record<Urgencia, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  urgente: {
    label: 'Urgentes',
    icon: AlertTriangle,
    color: 'text-destructive/70',
    bgColor: 'bg-destructive/5',
  },
  no_prazo: {
    label: 'No prazo',
    icon: Clock,
    color: 'text-primary/70',
    bgColor: 'bg-primary/3',
  },
  sem_prazo: {
    label: 'Sem prazo definido',
    icon: CircleDashed,
    color: 'text-muted-foreground/50',
    bgColor: 'bg-muted/3',
  },
  baixado: {
    label: 'Baixados',
    icon: CheckCircle2,
    color: 'text-success/70',
    bgColor: 'bg-success/3',
  },
};

function SectionDivider({ urgencia, count }: { urgencia: Urgencia; count: number }) {
  const config = SECTION_CONFIG[urgencia];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className={cn('flex items-center gap-1.5 rounded-md px-2 py-1', config.bgColor)}>
        <Icon className={cn('size-3.5', config.color)} />
        <span className={cn('text-[11px] font-semibold uppercase tracking-wider', config.color)}>
          {config.label}
        </span>
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground/40">{count}</span>
      <div className="flex-1 border-t border-border/10" />
    </div>
  );
}

function MissionItem({
  expediente,
  responsavelNome,
  tipoExpedienteNome,
  onSelect,
}: {
  expediente: Expediente;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
  onSelect: () => void;
}) {
  const dias = calcularDiasRestantes(expediente);
  const urgencia = classificarExpediente(expediente);
  const isBaixado = urgencia === 'baixado';

  const urgencyLevel =
    urgencia === 'urgente' ? 'critico' as const :
    urgencia === 'no_prazo' ? (dias !== null && dias <= 3 ? 'medio' as const : 'baixo' as const) :
    urgencia === 'baixado' ? 'ok' as const : 'baixo' as const;

  const borderColor =
    urgencia === 'urgente' ? 'border-l-destructive/70' :
    urgencia === 'no_prazo' ? 'border-l-primary/50' :
    urgencia === 'baixado' ? 'border-l-success/40' :
    'border-l-border/30';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left shadow-sm transition-all duration-150',
        'border-border/40 hover:border-primary/30 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'border-l-[3px]',
        borderColor,
        isBaixado && 'opacity-60',
      )}
    >
      <UrgencyDot level={urgencyLevel} />
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Tipo de expediente */}
          <p className={cn('text-sm font-medium', isBaixado && 'line-through')}>
            {tipoExpedienteNome || 'Sem tipo'}
          </p>

          {/* Cabeçalho: Partes (autora vs ré) */}
          {(expediente.nomeParteAutoraOrigem || expediente.nomeParteAutora || expediente.nomeParteReOrigem || expediente.nomeParteRe) && (
            <p className="text-sm font-medium text-foreground">
              <span>{expediente.nomeParteAutoraOrigem || expediente.nomeParteAutora || '—'}</span>
              <span className="mx-1.5 font-normal text-muted-foreground/60">vs</span>
              <span>{expediente.nomeParteReOrigem || expediente.nomeParteRe || '—'}</span>
            </p>
          )}

          {/* Cabeçalho: Número do processo (sem font-mono) */}
          <p className="text-xs text-foreground/75">
            Nº {expediente.numeroProcesso}
          </p>

          {/* Cabeçalho: Órgão jurisdicional */}
          {(expediente.descricaoOrgaoJulgador || expediente.siglaOrgaoJulgador) && (
            <p className="text-xs text-muted-foreground">
              {expediente.descricaoOrgaoJulgador || expediente.siglaOrgaoJulgador}
            </p>
          )}

          {/* Corpo: Resumo (descrição IA) — só renderiza se houver */}
          {expediente.descricaoArquivos && (
            <p className="pt-1.5 text-[12px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {expediente.descricaoArquivos}
            </p>
          )}

          {/* Corpo: Observações — só renderiza se houver */}
          {expediente.observacoes && (
            <p className="text-[11px] leading-relaxed text-muted-foreground/75 whitespace-pre-wrap">
              {expediente.observacoes}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {expediente.trt && (
            <AppBadge variant="outline" className="px-1.5 text-[10px]">{expediente.trt}</AppBadge>
          )}
          <AppBadge variant="outline" className="px-1.5 text-[10px]">{GRAU_TRIBUNAL_LABELS[expediente.grau]}</AppBadge>
        </div>
        {responsavelNome && (
          <p className="hidden max-w-32 truncate text-[11px] text-muted-foreground/45 lg:block">{responsavelNome}</p>
        )}
        <div className="shrink-0 text-right">
          {isBaixado ? (
            <p className="text-[10px] text-success/60">
              Baixado {expediente.baixadoEm ? format(new Date(expediente.baixadoEm), 'HH:mm') : ''}
            </p>
          ) : expediente.dataPrazoLegalParte ? (
            <p className={cn(
              'text-[10px] tabular-nums font-medium',
              urgencia === 'urgente' ? 'text-destructive/70' : 'text-muted-foreground/50',
            )}>
              {getDiasLabel(dias, expediente.prazoVencido)}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/35">—</p>
          )}
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesWeekMission({
  weekNavigatorProps,
  expedientes,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesWeekMissionProps) {
  const selectedDate = weekNavigatorProps.selectedDate;

  // Filter received expedientes to the current week's date range
  const weekExpedientes = React.useMemo(() => {
    const weekStart = weekNavigatorProps.weekDays[0]?.date;
    const weekEnd = weekNavigatorProps.weekDays[weekNavigatorProps.weekDays.length - 1]?.date;
    if (!weekStart || !weekEnd) return expedientes;

    return expedientes.filter((e) => {
      const prazo = e.dataPrazoLegalParte ? new Date(e.dataPrazoLegalParte) : null;
      if (!prazo) return false;
      const prazoDay = startOfDay(prazo);
      return prazoDay >= startOfDay(weekStart) && prazoDay <= startOfDay(weekEnd);
    });
  }, [expedientes, weekNavigatorProps.weekDays]);

  const pendentes = React.useMemo(() => weekExpedientes.filter((e) => !e.baixadoEm), [weekExpedientes]);
  const baixados = React.useMemo(() => weekExpedientes.filter((e) => !!e.baixadoEm), [weekExpedientes]);

  // Lookup maps
  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (usuariosData ?? []).forEach((u) => map.set(u.id, getUsuarioNome(u)));
    return map;
  }, [usuariosData]);

  const tiposMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (tiposExpedientesData ?? []).forEach((t) => {
      const alt = 'tipo_expediente' in t ? t.tipo_expediente : undefined;
      map.set(t.id, t.tipoExpediente || alt || `Tipo ${t.id}`);
    });
    return map;
  }, [tiposExpedientesData]);

  // Contagem por dia para o WeekStrip
  const contagemPorDia = React.useMemo(() => {
    const mapa = new Map<string, number>();
    pendentes.forEach((exp) => {
      if (exp.dataPrazoLegalParte) {
        try {
          const d = parseISO(exp.dataPrazoLegalParte);
          const key = format(d, 'yyyy-MM-dd');
          mapa.set(key, (mapa.get(key) ?? 0) + 1);
        } catch { /* ignore */ }
      }
    });
    return mapa;
  }, [pendentes]);

  // Expedientes do dia selecionado
  const todosExpedientes = React.useMemo(() => [...pendentes, ...baixados], [pendentes, baixados]);

  const doDia = React.useMemo(() => {
    return todosExpedientes.filter((exp) => {
      if (!exp.dataPrazoLegalParte) return false;
      try {
        return isSameDay(parseISO(exp.dataPrazoLegalParte), selectedDate);
      } catch { return false; }
    });
  }, [todosExpedientes, selectedDate]);

  // Vencidos do dia (sem prazo datado neste dia, mas vencidos globais)
  const vencidosDoDia = React.useMemo(() => {
    return pendentes.filter((exp) => {
      if (!exp.dataPrazoLegalParte) return false;
      try {
        return isSameDay(parseISO(exp.dataPrazoLegalParte), selectedDate) && (exp.prazoVencido || calcularDiasRestantes(exp)! < 0);
      } catch { return false; }
    });
  }, [pendentes, selectedDate]);

  // Agrupar por urgência
  const grupos = React.useMemo(() => {
    const g: Record<Urgencia, Expediente[]> = {
      urgente: [],
      no_prazo: [],
      sem_prazo: [],
      baixado: [],
    };
    doDia.forEach((exp) => {
      g[classificarExpediente(exp)].push(exp);
    });
    // Sort dentro de cada grupo por prazo
    const sortByPrazo = (a: Expediente, b: Expediente) => {
      const da = calcularDiasRestantes(a) ?? 999;
      const db = calcularDiasRestantes(b) ?? 999;
      return da - db;
    };
    g.urgente.sort(sortByPrazo);
    g.no_prazo.sort(sortByPrazo);
    return g;
  }, [doDia]);

  // KPIs do dia
  const kpis = React.useMemo(() => ({
    total: doDia.length,
    vencidos: grupos.urgente.length,
    baixados: grupos.baixado.length,
    pendentes: grupos.no_prazo.length + grupos.sem_prazo.length,
  }), [doDia, grupos]);

  // WeekDays com badges de contagem
  const weekDaysComContagem = React.useMemo(() => {
    return weekNavigatorProps.weekDays.map((day) => ({
      ...day,
      badge: contagemPorDia.get(format(day.date, 'yyyy-MM-dd')) ?? undefined,
    }));
  }, [weekNavigatorProps.weekDays, contagemPorDia]);

  // Selected expediente for detail sheet
  const [selectedExpediente, setSelectedExpediente] = React.useState<Expediente | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleSelect = React.useCallback((exp: Expediente) => {
    setSelectedExpediente(exp);
    setDetailOpen(true);
  }, []);

  const dateLabel = React.useMemo(() => {
    return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      {/* Week Navigator */}
      <WeekNavigator
        weekDays={weekDaysComContagem}
        selectedDate={weekNavigatorProps.selectedDate}
        onDateSelect={weekNavigatorProps.onDateSelect}
        onPreviousWeek={weekNavigatorProps.onPreviousWeek}
        onNextWeek={weekNavigatorProps.onNextWeek}
        onToday={weekNavigatorProps.onToday}
        isCurrentWeek={weekNavigatorProps.isCurrentWeek}
      />

      {/* Hero Card */}
      {vencidosDoDia.length > 0 ? (
        <InsightBanner type="alert">
          <strong>{vencidosDoDia.length} expediente(s) vencido(s)</strong> precisam de acao imediata neste dia.
        </InsightBanner>
      ) : kpis.total > 0 && kpis.pendentes === 0 && kpis.baixados > 0 ? (
        <InsightBanner type="success">
          <strong>Todos os expedientes do dia foram baixados!</strong> Nenhum pendente.
        </InsightBanner>
      ) : null}

      {/* Day Mission KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: kpis.total, icon: FileText, color: 'text-muted-foreground/60' },
          { label: 'Vencidos', value: kpis.vencidos, icon: AlertTriangle, color: 'text-destructive/60', highlight: kpis.vencidos > 0 },
          { label: 'Baixados', value: kpis.baixados, icon: CheckCircle2, color: 'text-success/60' },
          { label: 'Pendentes', value: kpis.pendentes, icon: CalendarClock, color: 'text-primary/60' },
        ].map((kpi) => (
          <GlassPanel key={kpi.label} depth={kpi.highlight ? 2 : 1} className={cn('px-4 py-3', kpi.highlight && 'border-destructive/15')}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">{kpi.label}</p>
                <p className={cn('mt-1 text-xl font-bold tabular-nums tracking-tight', kpi.highlight && 'text-destructive/80')}>
                  <AnimatedNumber value={kpi.value} />
                </p>
              </div>
              <kpi.icon className={cn('size-4', kpi.color)} />
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Day Label */}
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">
        {dateLabel}
      </p>

      {/* Timeline por urgência */}
      <div className="flex flex-col gap-2">
        {doDia.length === 0 ? (
          <GlassPanel depth={1} className="flex min-h-45 flex-col items-center justify-center p-8 text-center">
            <CalendarClock className="size-10 text-muted-foreground/20" />
            <Heading level="card" className="mt-4 text-sm">Nenhum expediente neste dia</Heading>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground/55">
              Selecione outro dia na barra de semana acima.
            </p>
          </GlassPanel>
        ) : (
          <>
            {grupos.urgente.length > 0 && (
              <>
                <SectionDivider urgencia="urgente" count={grupos.urgente.length} />
                <div className="flex flex-col gap-1.5">
                  {grupos.urgente.map((exp) => (
                    <MissionItem
                      key={exp.id}
                      expediente={exp}
                      responsavelNome={exp.responsavelId ? usuariosMap.get(exp.responsavelId) : null}
                      tipoExpedienteNome={exp.tipoExpedienteId ? tiposMap.get(exp.tipoExpedienteId) : null}
                      onSelect={() => handleSelect(exp)}
                    />
                  ))}
                </div>
              </>
            )}

            {grupos.no_prazo.length > 0 && (
              <>
                <SectionDivider urgencia="no_prazo" count={grupos.no_prazo.length} />
                <div className="flex flex-col gap-1.5">
                  {grupos.no_prazo.map((exp) => (
                    <MissionItem
                      key={exp.id}
                      expediente={exp}
                      responsavelNome={exp.responsavelId ? usuariosMap.get(exp.responsavelId) : null}
                      tipoExpedienteNome={exp.tipoExpedienteId ? tiposMap.get(exp.tipoExpedienteId) : null}
                      onSelect={() => handleSelect(exp)}
                    />
                  ))}
                </div>
              </>
            )}

            {grupos.sem_prazo.length > 0 && (
              <>
                <SectionDivider urgencia="sem_prazo" count={grupos.sem_prazo.length} />
                <div className="flex flex-col gap-1.5">
                  {grupos.sem_prazo.map((exp) => (
                    <MissionItem
                      key={exp.id}
                      expediente={exp}
                      responsavelNome={exp.responsavelId ? usuariosMap.get(exp.responsavelId) : null}
                      tipoExpedienteNome={exp.tipoExpedienteId ? tiposMap.get(exp.tipoExpedienteId) : null}
                      onSelect={() => handleSelect(exp)}
                    />
                  ))}
                </div>
              </>
            )}

            {grupos.baixado.length > 0 && (
              <>
                <SectionDivider urgencia="baixado" count={grupos.baixado.length} />
                <div className="flex flex-col gap-1.5">
                  {grupos.baixado.map((exp) => (
                    <MissionItem
                      key={exp.id}
                      expediente={exp}
                      responsavelNome={exp.responsavelId ? usuariosMap.get(exp.responsavelId) : null}
                      tipoExpedienteNome={exp.tipoExpedienteId ? tiposMap.get(exp.tipoExpedienteId) : null}
                      onSelect={() => handleSelect(exp)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
            </div>
      <ExpedienteVisualizarDialog
        expediente={selectedExpediente}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
