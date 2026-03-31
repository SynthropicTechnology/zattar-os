'use client';

import { Calendar, Clock, MapPin } from 'lucide-react';
import { WidgetContainer } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import type { AudienciaProxima } from '../../domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTipoStyles(tipo: string | null): {
  borderColor: string;
  pillColor: string;
  bgColor: string;
} {
  const t = (tipo ?? '').toLowerCase();

  if (t.includes('instrução') || t.includes('instrucao')) {
    return {
      borderColor: 'border-l-primary',
      pillColor: 'bg-primary/15 text-primary',
      bgColor: 'bg-primary/[0.06]',
    };
  }
  if (t.includes('conciliação') || t.includes('conciliacao')) {
    return {
      borderColor: 'border-l-[hsl(var(--warning))]',
      pillColor: 'bg-warning/15 text-warning',
      bgColor: '',
    };
  }
  if (t.includes('julgamento')) {
    return {
      borderColor: 'border-l-destructive',
      pillColor: 'bg-destructive/15 text-destructive',
      bgColor: '',
    };
  }
  return {
    borderColor: 'border-l-muted-foreground/30',
    pillColor: 'bg-muted-foreground/10 text-muted-foreground/70',
    bgColor: '',
  };
}

function fmtDataAudiencia(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <Calendar className="size-8 text-muted-foreground/45" />
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Nenhuma audiência agendada nos próximos 30 dias
      </p>
    </div>
  );
}

// ─── Audiência Item ───────────────────────────────────────────────────────────

function AudienciaItem({
  audiencia,
  isFirst,
}: {
  audiencia: AudienciaProxima;
  isFirst: boolean;
}) {
  const styles = getTipoStyles(audiencia.tipo_audiencia);
  const parte = audiencia.polo_ativo_nome ?? audiencia.polo_passivo_nome ?? 'Parte não informada';

  return (
    <div
      className={`
        border-l-2 pl-3 py-2 rounded-r-lg transition-colors duration-150
        ${styles.borderColor}
        ${isFirst ? `${styles.bgColor} border rounded-lg border-border/20 pr-2` : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${styles.pillColor}`}
            >
              {audiencia.tipo_audiencia ?? 'Sem tipo'}
            </span>
            {isFirst && (
              <span className="text-[9px] font-medium text-primary/70 uppercase tracking-wider">
                Próxima
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium mt-1 truncate">{parte}</p>
          <p className="text-[9px] text-muted-foreground/60 font-mono truncate">
            {audiencia.numero_processo}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground/60">
            <Calendar className="size-2.5" />
            <span>{fmtDataAudiencia(audiencia.data_audiencia)}</span>
          </div>
          {audiencia.hora_audiencia && (
            <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground/50 mt-0.5">
              <Clock className="size-2.5" />
              <span>{audiencia.hora_audiencia}</span>
            </div>
          )}
        </div>
      </div>
      {audiencia.local && (
        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground/60">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">{audiencia.local}</span>
        </div>
      )}
    </div>
  );
}

// ─── ProximasAudiencias ───────────────────────────────────────────────────────

export function ProximasAudiencias() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <WidgetSkeleton size="md" />;
  }

  if (error || !data) {
    return (
      <WidgetContainer
        title="Próximas Audiências"
        icon={Calendar}
        subtitle="Agenda dos próximos 30 dias"
        className="md:col-span-2"
      >
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Não foi possível carregar as audiências.
        </p>
      </WidgetContainer>
    );
  }

  const audiencias = data.proximasAudiencias ?? [];

  return (
    <WidgetContainer
      title="Próximas Audiências"
      icon={Calendar}
      subtitle="Agenda dos próximos 30 dias"
      className="md:col-span-2"
    >
      {audiencias.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {audiencias.map((a, index) => (
            <AudienciaItem key={a.id} audiencia={a} isFirst={index === 0} />
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}
