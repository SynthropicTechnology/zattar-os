'use client';

import { AlertTriangle } from 'lucide-react';
import { WidgetContainer, UrgencyDot, ListItem, fmtData } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import type { ExpedienteUrgente } from '../../domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo';

function getUrgencyLevel(diasRestantes: number): UrgencyLevel {
  if (diasRestantes < 0) return 'critico';
  if (diasRestantes === 0) return 'alto';
  if (diasRestantes <= 3) return 'medio';
  return 'baixo';
}

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critico: 'Vencido',
  alto: 'Hoje',
  medio: 'Em breve',
  baixo: '7d+',
};

function getDiasLabel(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)}d vencido`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  return `${dias} dias restantes`;
}

const ORIGEM_BADGE_STYLES: Record<string, string> = {
  expedientes: 'bg-primary/10 text-primary/70',
  expedientes_manuais: 'bg-muted/30 text-muted-foreground/50',
};

const ORIGEM_LABELS: Record<string, string> = {
  expedientes: 'PJE/CNJ',
  expedientes_manuais: 'Manual',
};

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <AlertTriangle className="size-8 text-muted-foreground/20" />
      <p className="text-[11px] text-muted-foreground/40 text-center">
        Nenhum expediente urgente no momento
      </p>
    </div>
  );
}

// ─── Expediente Item ──────────────────────────────────────────────────────────

function ExpedienteItem({ item }: { item: ExpedienteUrgente }) {
  const level = getUrgencyLevel(item.dias_restantes);
  const title = `${item.tipo_expediente} — Proc. ${item.numero_processo}`;
  const origemStyle = ORIGEM_BADGE_STYLES[item.origem] ?? 'bg-muted/30 text-muted-foreground/50';
  const origemLabel = ORIGEM_LABELS[item.origem] ?? item.origem;

  return (
    <ListItem>
      <UrgencyDot level={level} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium leading-tight truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
          {URGENCY_LABELS[level]} · {fmtData(item.prazo_fatal)} · {getDiasLabel(item.dias_restantes)}
        </p>
      </div>
      <span
        className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${origemStyle}`}
      >
        {origemLabel}
      </span>
    </ListItem>
  );
}

// ─── UrgencyList ──────────────────────────────────────────────────────────────

export function UrgencyList() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <WidgetSkeleton size="md" />;
  }

  if (error || !data) {
    return (
      <WidgetContainer
        title="Expedientes Urgentes"
        icon={AlertTriangle}
        subtitle="Por urgência de prazo"
        depth={1}
        className="md:col-span-2"
      >
        <p className="text-[11px] text-muted-foreground/40 py-4 text-center">
          Não foi possível carregar os expedientes.
        </p>
      </WidgetContainer>
    );
  }

  const expedientes = (data.expedientesUrgentes ?? []).slice().sort((a, b) => {
    return a.dias_restantes - b.dias_restantes;
  });

  return (
    <WidgetContainer
      title="Expedientes Urgentes"
      icon={AlertTriangle}
      subtitle="Por urgência de prazo"
      depth={1}
      className="md:col-span-2"
    >
      {expedientes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-0.5">
          {expedientes.map((item) => (
            <ExpedienteItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}
