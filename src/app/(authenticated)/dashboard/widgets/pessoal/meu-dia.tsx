'use client';

/**
 * WidgetMeuDia — Widget conectado
 * Fontes:
 *   - useDashboard() → proximasAudiencias (audiências de hoje)
 *   - useReminders() → lembretes de hoje
 * Merge em timeline unificada ordenada por hora.
 */

import { Calendar, Gavel, Bell, CheckSquare } from 'lucide-react';
import { WidgetContainer, InsightBanner } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { formatarPartes, obterContextoProcesso } from '../shared/processo-display';
import { useDashboard, useReminders, isDashboardUsuario } from '../../hooks';
import type { AudienciaProxima, Lembrete } from '../../domain';

// ─── Tipos da Timeline ────────────────────────────────────────────────────────

type TipoEvento = 'audiencia' | 'lembrete' | 'tarefa';
type EventoState = 'done' | 'near' | 'next' | 'future';

interface EventoTimeline {
  id: string;
  hora: string | null; // HH:MM
  titulo: string;
  subtitulo?: string;
  contextoProcesso?: string;
  numeroProcesso?: string;
  tipo: TipoEvento;
  done: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOJE_STR = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function hojeISO(): string {
  return HOJE_STR;
}

function audienciaParaEvento(a: AudienciaProxima): EventoTimeline {
  let hora = a.hora_audiencia ?? null;
  if (hora && hora.length >= 5) {
    hora = hora.slice(0, 5) + 'h';
  }

  return {
    id: `aud-${a.id}`,
    hora,
    titulo: a.tipo_audiencia ?? 'Audiência',
    subtitulo: formatarPartes(a.polo_ativo_nome, a.polo_passivo_nome),
    contextoProcesso: obterContextoProcesso(a),
    numeroProcesso: a.numero_processo,
    tipo: 'audiencia',
    done: false,
  };
}

function lembreteParaEvento(l: Lembrete): EventoTimeline {
  const d = new Date(l.data_lembrete);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h';

  return {
    id: `lem-${l.id}`,
    hora,
    titulo: l.texto,
    tipo: 'lembrete',
    done: l.concluido,
  };
}

function horaParaMinutos(hora: string | null): number {
  if (!hora) return 9999; // sem hora → final da lista
  const [h, m] = hora.replace(/h/g, '').split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function agoraEmMinutos(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

function ehHoje(isoStr: string): boolean {
  return isoStr.slice(0, 10) === hojeISO();
}

// ─── Componentes de Ícone de Trilho ──────────────────────────────────────────

function DotAudiencia({ state }: { state: EventoState }) {
  const isDone = state === 'done';
  const isNear = state === 'near';
  const isNext = state === 'next';

  const border = isDone ? 'border-muted-foreground/20' : isNear ? 'border-orange-500/80' : isNext ? 'border-primary' : 'border-primary/50';
  const bg = isDone ? 'bg-muted-foreground/20' : isNear ? 'bg-orange-500/30' : isNext ? 'bg-primary/30' : 'bg-transparent';
  const innerBg = isDone ? 'bg-muted-foreground/30' : isNear ? 'bg-orange-500' : isNext ? 'bg-primary' : 'bg-primary/60';

  return (
    <div className={`size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${border} ${bg}`}>
      <div className={`size-1.5 rounded-full ${innerBg}`} />
    </div>
  );
}

function DotLembrete({ state }: { state: EventoState }) {
  const isDone = state === 'done';
  const isNear = state === 'near';
  const isNext = state === 'next';

  let bgClass = 'bg-border/40';
  if (isDone) bgClass = 'bg-muted-foreground/25';
  else if (isNear) bgClass = 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]';
  else if (isNext) bgClass = 'bg-primary shadow-[0_0_6px_color-mix(in_oklch,var(--primary)_60%,transparent)]';

  return <div className={`size-2 rounded-full mt-0.5 shrink-0 ${bgClass}`} />;
}

function DotTarefa({ state }: { state: EventoState }) {
  const isDone = state === 'done';
  const isNear = state === 'near';
  const isNext = state === 'next';

  const border = isDone ? 'border-muted-foreground/20' : isNear ? 'border-orange-500' : isNext ? 'border-primary/80' : 'border-border/40';
  const bg = isDone ? 'bg-muted-foreground/15' : 'bg-transparent';
  const innerBg = isDone ? 'bg-muted-foreground/40' : isNear ? 'bg-orange-500' : isNext ? 'bg-primary' : 'bg-transparent';

  return (
    <div className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${border} ${bg}`}>
      {(isDone || isNext || isNear) && <div className={`size-1.5 rounded-sm ${innerBg}`} />}
    </div>
  );
}

const TIPO_ICONS: Record<TipoEvento, React.ComponentType<{ className?: string }>> = {
  audiencia: Gavel,
  lembrete: Bell,
  tarefa: CheckSquare,
};

// ─── Widget ───────────────────────────────────────────────────────────────────

export function WidgetMeuDia() {
  const { data, isLoading: isDashLoading } = useDashboard();
  const { lembretes } = useReminders();

  if (isDashLoading) return <WidgetSkeleton size="md" />;

  // Audiências de hoje
  const audienciasHoje: AudienciaProxima[] = data
    ? (data.proximasAudiencias ?? []).filter((a) => ehHoje(a.data_audiencia))
    : [];

  // Lembretes de hoje (não concluídos + concluídos de hoje)
  const lembretesHoje: Lembrete[] = lembretes.filter((l) => ehHoje(l.data_lembrete));

  // Monta timeline
  const eventos: EventoTimeline[] = [
    ...audienciasHoje.map(audienciaParaEvento),
    ...lembretesHoje.map(lembreteParaEvento),
  ].sort((a, b) => horaParaMinutos(a.hora) - horaParaMinutos(b.hora));

  const agora = agoraEmMinutos();

  // Índice do próximo evento não concluído
  const proximoIdx = eventos.findIndex(
    (e) => !e.done && horaParaMinutos(e.hora) >= agora
  );

  if (eventos.length === 0) {
    return (
      <WidgetContainer
        title="Meu Dia"
        icon={Calendar}
        subtitle="Tarefas, lembretes e audiências — hoje"
        depth={2}
      >
        <InsightBanner type="info">
          Nenhum evento agendado para hoje. Aproveite para avançar nas tarefas em aberto.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  // Aviso de audiência se usuário tiver proximasAudiencias mas for admin
  const isUser = data && isDashboardUsuario(data);
  const subtitleStr = isUser
    ? 'Tarefas, lembretes e audiências — hoje'
    : 'Audiências e lembretes — hoje';

  return (
    <WidgetContainer
      title="Meu Dia"
      icon={Calendar}
      subtitle={subtitleStr}
      depth={2}
    >
      <div className="relative isolate pt-1">
        {/* Linha vertical conectora corrigida */}
        <div
          className="absolute left-5 top-4 bottom-4 w-px bg-border/40 -z-10"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-1">
          {eventos.map((evento, i) => {
            const isNext = i === proximoIdx;
            const minutos = evento.hora ? horaParaMinutos(evento.hora) : null;
            const isDone = evento.done || (minutos !== null && minutos < agora);
            
            let state: EventoState = 'future';
            if (isDone) {
              state = 'done';
            } else if (minutos !== null) {
              const diff = minutos - agora;
              if (diff <= 60 && diff >= 0) {
                state = 'near';
              } else if (isNext) {
                state = 'next';
              }
            }

            return (
              <div
                key={evento.id}
                className={`flex items-start gap-3 px-2 py-2 rounded-xl transition-all duration-150 group ${
                  state === 'near' 
                    ? 'bg-orange-500/[0.04] ring-1 ring-orange-500/20'
                    : isNext
                    ? 'bg-primary/[0.04] ring-1 ring-primary/20'
                    : 'hover:bg-muted/40'
                }`}
              >
                {/* Coluna do Ícone Timeline (Centralizado no box w-6) */}
                <div className="w-6 flex justify-center shrink-0 mt-0.5 z-10 bg-background/80 rounded-full group-hover:bg-transparent backdrop-blur-sm">
                  {evento.tipo === 'audiencia' ? (
                    <DotAudiencia state={state} />
                  ) : evento.tipo === 'lembrete' ? (
                    <DotLembrete state={state} />
                  ) : (
                    <DotTarefa state={state} />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                  {/* Informações à esquerda */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className={`text-[11px] font-semibold leading-tight truncate ${
                        isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {evento.titulo}
                    </p>
                    {evento.subtitulo && (
                      <p className={`text-[10px] mt-0.5 leading-tight truncate ${isDone ? 'text-muted-foreground/70' : 'text-foreground/80'}`}>
                        {evento.subtitulo}
                      </p>
                    )}
                    {evento.contextoProcesso && (
                      <p className={`text-[9px] mt-0.5 leading-tight truncate ${isDone ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                        {evento.contextoProcesso}
                      </p>
                    )}
                    {evento.numeroProcesso && (
                      <p className={`text-[9px] font-mono mt-0.5 truncate ${isDone ? 'text-muted-foreground/50' : 'text-muted-foreground/80'}`}>
                        {evento.numeroProcesso}
                      </p>
                    )}
                    {/* Sem badge de tipo aqui */}
                  </div>

                  {/* Horário à direita */}
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    {evento.hora && (
                      <span
                        className={`text-xs font-display tabular-nums font-semibold ${
                          isDone ? 'text-muted-foreground/70' : state === 'near' ? 'text-orange-500' : 'text-foreground/90'
                        }`}
                      >
                        {evento.hora}
                      </span>
                    )}
                    <span 
                      className={`text-[9px] font-medium uppercase tracking-wider mt-0.5 ${
                        isDone ? 'text-muted-foreground/50' : state === 'near' ? 'text-orange-500/80' : 'text-primary/70'
                      }`}
                    >
                      {evento.tipo === 'audiencia' ? 'Audiência' : evento.tipo}
                    </span>
                    {state === 'near' && (
                       <span className="mt-1 text-[9px] uppercase tracking-wider font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded shadow-sm shrink-0">
                         Em Breve
                       </span>
                    )}
                    {state === 'next' && (
                      <span className="mt-1 text-[9px] uppercase tracking-wider font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded shadow-sm shrink-0">
                        Próximo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}
