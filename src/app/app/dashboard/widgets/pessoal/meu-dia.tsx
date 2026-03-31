'use client';

/**
 * WidgetMeuDia — Widget conectado (col-span-2)
 * Fontes:
 *   - useDashboard() → proximasAudiencias (audiências de hoje)
 *   - useReminders() → lembretes de hoje
 * Merge em timeline unificada ordenada por hora.
 */

import { Calendar, Gavel, Bell, CheckSquare } from 'lucide-react';
import { WidgetContainer, InsightBanner } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, useReminders, isDashboardUsuario } from '../../hooks';
import type { AudienciaProxima, Lembrete } from '../../domain';

// ─── Tipos da Timeline ────────────────────────────────────────────────────────

type TipoEvento = 'audiencia' | 'lembrete' | 'tarefa';

interface EventoTimeline {
  id: string;
  hora: string | null; // HH:MM
  titulo: string;
  tipo: TipoEvento;
  done: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOJE_STR = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function hojeISO(): string {
  return HOJE_STR;
}

function audienciaParaEvento(a: AudienciaProxima): EventoTimeline {
  const hora = a.hora_audiencia ?? null;
  const titulo =
    a.polo_ativo_nome && a.polo_passivo_nome
      ? `Audiência — ${a.polo_ativo_nome} x ${a.polo_passivo_nome}`
      : a.tipo_audiencia
      ? `${a.tipo_audiencia} — proc. ${a.numero_processo}`
      : `Audiência — proc. ${a.numero_processo}`;

  return {
    id: `aud-${a.id}`,
    hora,
    titulo,
    tipo: 'audiencia',
    done: false,
  };
}

function lembreteParaEvento(l: Lembrete): EventoTimeline {
  const d = new Date(l.data_lembrete);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
  const [h, m] = hora.split(':').map(Number);
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

function DotAudiencia({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        done
          ? 'border-muted-foreground/20 bg-muted-foreground/20'
          : isNext
          ? 'border-primary bg-primary/30'
          : 'border-primary/50 bg-transparent'
      }`}
    >
      <div
        className={`size-1.5 rounded-full ${
          done ? 'bg-muted-foreground/30' : isNext ? 'bg-primary' : 'bg-primary/60'
        }`}
      />
    </div>
  );
}

function DotLembrete({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-2 rounded-full mt-0.5 shrink-0 ${
        done
          ? 'bg-muted-foreground/25'
          : isNext
          ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]'
          : 'bg-border/40'
      }`}
    />
  );
}

function DotTarefa({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
        done
          ? 'border-muted-foreground/20 bg-muted-foreground/15'
          : isNext
          ? 'border-primary/60 bg-transparent'
          : 'border-border/30 bg-transparent'
      }`}
    >
      {done && <div className="size-1.5 rounded-sm bg-muted-foreground/40" />}
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
  const { lembretes, isPending } = useReminders();

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
        className="md:col-span-2"
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
      className="md:col-span-2"
    >
      <div className="relative">
        {/* Linha vertical conectora */}
        <div
          className="absolute left-1.75 top-2 bottom-2 w-px bg-border/20"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-0.5">
          {eventos.map((evento, i) => {
            const isNext = i === proximoIdx;
            const isDone = evento.done || (evento.hora !== null && horaParaMinutos(evento.hora) < agora);
            const Icon = TIPO_ICONS[evento.tipo];

            return (
              <div
                key={evento.id}
                className={`flex items-start gap-3 px-2 py-1.5 rounded-xl transition-all duration-150 ${
                  isNext
                    ? 'bg-primary/[0.07] ring-1 ring-primary/20'
                    : 'hover:bg-white/4'
                }`}
              >
                {/* Dot no trilho */}
                <div className="relative z-10 mt-0.5">
                  {evento.tipo === 'audiencia' ? (
                    <DotAudiencia done={isDone} isNext={isNext} />
                  ) : evento.tipo === 'lembrete' ? (
                    <DotLembrete done={isDone} isNext={isNext} />
                  ) : (
                    <DotTarefa done={isDone} isNext={isNext} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium truncate flex-1 ${
                        isDone
                          ? 'line-through text-muted-foreground/30'
                          : isNext
                          ? 'text-foreground/90'
                          : 'text-foreground/70'
                      }`}
                    >
                      {evento.titulo}
                    </span>
                    {isNext && (
                      <span className="text-[8px] uppercase tracking-wider text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                        próximo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Icon
                      className={`size-2.5 shrink-0 ${
                        isDone ? 'text-muted-foreground/20' : 'text-muted-foreground/40'
                      }`}
                    />
                    {evento.hora && (
                      <span
                        className={`text-[9px] tabular-nums ${
                          isDone ? 'text-muted-foreground/25' : 'text-muted-foreground/40'
                        }`}
                      >
                        {evento.hora}
                      </span>
                    )}
                    <span
                      className={`text-[9px] capitalize ${
                        isDone ? 'text-muted-foreground/20' : 'text-muted-foreground/35'
                      }`}
                    >
                      {evento.tipo}
                    </span>
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
