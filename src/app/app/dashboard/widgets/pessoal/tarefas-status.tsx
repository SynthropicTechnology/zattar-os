'use client';

/**
 * Widget: Status de Tarefas (Pessoal)
 * ============================================================================
 * Conectado ao hook useDashboard().
 * Deriva dados de tarefas a partir de produtividade.baixasSemana — aproximação
 * razoável até que um módulo de tarefas dedicado esteja disponível.
 *
 * Uso:
 *   import { WidgetTarefasStatus } from '@/app/app/dashboard/widgets/pessoal/tarefas-status'
 * ============================================================================
 */

import { CheckSquare } from 'lucide-react';
import {
  MiniDonut,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks/use-dashboard';

export function WidgetTarefasStatus() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return (
      <WidgetSkeleton size="sm" />
    );
  }

  // Derivar tarefas a partir dos dados de produtividade disponíveis.
  // Aproximação: baixasSemana = concluídas na semana.
  // Total estimado = baixasMes / 4 semanas * 1.5 (inclui pendentes em aberto).
  // Em andamento: sem dados reais — mantido em 0 até integração futura.
  const produtividade =
    data.role === 'user'
      ? data.produtividade
      : (() => {
          // Admin: agregar de performanceAdvogados como estimativa
          const total = data.performanceAdvogados.reduce(
            (acc, adv) => ({ baixasSemana: acc.baixasSemana + adv.baixasSemana, baixasMes: acc.baixasMes + adv.baixasMes }),
            { baixasSemana: 0, baixasMes: 0 }
          );
          return {
            baixasHoje: 0,
            baixasSemana: total.baixasSemana,
            baixasMes: total.baixasMes,
            mediaDiaria: 0,
            comparativoSemanaAnterior: 0,
            porDia: [],
          };
        })();

  const concluidas = produtividade.baixasSemana;
  const estimativaTotal = Math.max(
    concluidas + Math.round(produtividade.baixasMes / 4),
    concluidas + 1
  );
  const pendentes = Math.max(estimativaTotal - concluidas, 0);
  const emAndamento = 0; // sem dados reais — integração futura
  const total = concluidas + pendentes + emAndamento;

  const taxaSemana =
    total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const segments = [
    { value: pendentes || 1,   color: 'hsl(var(--warning))',      label: 'Pendentes' },
    { value: emAndamento || 0, color: 'hsl(220 70% 60%)',         label: 'Em Andamento' },
    { value: concluidas || 0,  color: 'hsl(142 60% 45%)',         label: 'Concluídas' },
  ].filter((s) => s.value > 0);

  return (
    <WidgetContainer
      title="Status das Tarefas"
      icon={CheckSquare}
      subtitle="Baseado em baixas da semana"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={segments}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {[
            { label: 'Pendentes',    value: pendentes,   color: 'hsl(var(--warning))' },
            { label: 'Em Andamento', value: emAndamento, color: 'hsl(220 70% 60%)' },
            { label: 'Concluídas',   value: concluidas,  color: 'hsl(142 60% 45%)' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: row.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {row.label}
              </span>
              <span className="text-[10px] font-medium tabular-nums">
                {fmtNum(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de progresso semanal */}
      <div className="mt-4 pt-3 border-t border-border/10 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Taxa de conclusão semanal
          </span>
          <span className="text-[10px] font-semibold tabular-nums">
            {taxaSemana}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-700"
            style={{ width: `${taxaSemana}%` }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground/30">
          Estimativa — dados completos de tarefas em desenvolvimento
        </p>
      </div>
    </WidgetContainer>
  );
}
