'use client';

/**
 * WidgetLembretesAtivos — Widget conectado
 * Fonte: useReminders() → lembretes (Lembrete[])
 * Filtra concluido === false e exibe lista com urgência, texto e hora.
 */

import { Bell } from 'lucide-react';
import {
  WidgetContainer,
  UrgencyDot,
  ListItem,
  InsightBanner,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useReminders } from '../../hooks';
import type { PrioridadeLembrete } from '../../domain';

type UrgencyLevel = 'alto' | 'medio' | 'baixo';

function prioridadeParaNivel(prioridade: PrioridadeLembrete): UrgencyLevel {
  if (prioridade === 'high') return 'alto';
  if (prioridade === 'medium') return 'medio';
  return 'baixo';
}

function formatarHoraLembrete(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const hoje = new Date();
    const isHoje =
      d.getFullYear() === hoje.getFullYear() &&
      d.getMonth() === hoje.getMonth() &&
      d.getDate() === hoje.getDate();

    if (isHoje) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

export function WidgetLembretesAtivos() {
  const { lembretes, isPending } = useReminders();

  if (isPending && lembretes.length === 0) return <WidgetSkeleton size="sm" />;

  const ativos = lembretes
    .filter((l) => !l.concluido)
    .sort((a, b) => {
      // Alta prioridade primeiro
      const ordem = { high: 0, medium: 1, low: 2 };
      return ordem[a.prioridade] - ordem[b.prioridade];
    });

  const subtitle =
    ativos.length === 0
      ? 'Nenhum lembrete pendente'
      : `${ativos.length} lembrete${ativos.length > 1 ? 's' : ''} pendente${ativos.length > 1 ? 's' : ''}`;

  return (
    <WidgetContainer
      title="Lembretes Ativos"
      icon={Bell}
      subtitle={subtitle}
      depth={1}
    >
      {ativos.length === 0 ? (
        <InsightBanner type="success">
          Todos os lembretes foram concluídos. Bom trabalho!
        </InsightBanner>
      ) : (
        <div className="flex flex-col gap-0.5">
          {ativos.slice(0, 5).map((lembrete) => (
            <ListItem key={lembrete.id}>
              <UrgencyDot level={prioridadeParaNivel(lembrete.prioridade)} />
              <span className="text-[10px] text-foreground/75 flex-1 truncate leading-snug">
                {lembrete.texto}
              </span>
              <span className="text-[9px] text-muted-foreground/60 shrink-0 tabular-nums">
                {formatarHoraLembrete(lembrete.data_lembrete)}
              </span>
            </ListItem>
          ))}

          {ativos.length > 5 && (
            <p className="text-[9px] text-muted-foreground/55 mt-1 pl-1">
              +{ativos.length - 5} lembrete{ativos.length - 5 > 1 ? 's' : ''} adicionais
            </p>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
