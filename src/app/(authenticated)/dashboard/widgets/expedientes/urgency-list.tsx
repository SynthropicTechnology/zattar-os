'use client';

import { AlertTriangle } from 'lucide-react';
import { WidgetContainer, UrgencyDot, ListItem, fmtData } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { formatarPartes, obterContextoProcesso } from '../shared/processo-display';
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <AlertTriangle className="size-8 text-muted-foreground/45" />
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Nenhum expediente urgente no momento
      </p>
    </div>
  );
}

// ─── Expediente Item ──────────────────────────────────────────────────────────

function ExpedienteItem({ item }: { item: ExpedienteUrgente }) {
  const level = getUrgencyLevel(item.dias_restantes);
  const partes = formatarPartes(item.nome_parte_autora, item.nome_parte_re);
  const contextoProcesso = obterContextoProcesso(item);

  return (
    <ListItem className="items-start">
      <UrgencyDot level={level} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium leading-tight">{item.tipo_expediente}</p>
        {partes && (
          <p className="text-[10px] text-foreground/65 mt-0.5 leading-tight">
            {partes}
          </p>
        )}
        {contextoProcesso && (
          <p className="text-[10px] text-foreground/55 mt-0.5 leading-tight">
            {contextoProcesso}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/60 font-mono break-all leading-relaxed mt-0.5">
          {item.numero_processo}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {URGENCY_LABELS[level]} · {fmtData(item.prazo_fatal)} · {getDiasLabel(item.dias_restantes)}
        </p>
      </div>
    </ListItem>
  );
}

// ─── UrgencyList ──────────────────────────────────────────────────────────────

export function UrgencyList() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <WidgetSkeleton size="sm" />;
  }

  if (error || !data) {
    return (
      <WidgetContainer
        title="Expedientes Urgentes"
        icon={AlertTriangle}
        subtitle="Por urgência de prazo"
        depth={1}
      >
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
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
