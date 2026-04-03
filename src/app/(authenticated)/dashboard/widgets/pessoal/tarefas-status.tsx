'use client';

/**
 * Widget: Status de Tarefas (Pessoal)
 * ============================================================================
 * Conectado ao módulo de tarefas real via actionListarTarefas().
 * Exibe distribuição por status (pendentes, em andamento, concluídas).
 *
 * Uso:
 *   import { WidgetTarefasStatus } from '@/app/(authenticated)/dashboard/widgets/pessoal/tarefas-status'
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import {
  MiniDonut,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { actionListarTarefas } from '@/app/(authenticated)/tarefas/actions/tarefas-actions';

interface TarefasCounts {
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  total: number;
}

function useTarefasCounts(): { counts: TarefasCounts | null; isLoading: boolean; error: string | null } {
  const [counts, setCounts] = useState<TarefasCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const result = await actionListarTarefas({ limit: 500 });
        if (!result.success) {
          setError(result.error);
          return;
        }

        const tasks = (result.data as { tasks?: Array<{ status: string }> })?.tasks ?? [];
        const pendentes = tasks.filter(
          (t) => t.status === 'backlog' || t.status === 'todo'
        ).length;
        const emAndamento = tasks.filter(
          (t) => t.status === 'in progress'
        ).length;
        const concluidas = tasks.filter(
          (t) => t.status === 'done'
        ).length;

        setCounts({
          pendentes,
          emAndamento,
          concluidas,
          total: pendentes + emAndamento + concluidas,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return { counts, isLoading, error };
}

export function WidgetTarefasStatus() {
  const { counts, isLoading, error } = useTarefasCounts();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !counts) {
    return <WidgetSkeleton size="sm" />;
  }

  const { pendentes, emAndamento, concluidas, total } = counts;

  const taxaConclusao =
    total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const segments = [
    { value: pendentes || 0,   color: 'hsl(var(--warning))',      label: 'Pendentes' },
    { value: emAndamento || 0, color: 'hsl(220 70% 60%)',         label: 'Em Andamento' },
    { value: concluidas || 0,  color: 'hsl(142 60% 45%)',         label: 'Concluídas' },
  ].filter((s) => s.value > 0);

  return (
    <WidgetContainer
      title="Status das Tarefas"
      icon={CheckSquare}
      subtitle="Distribuição real das tarefas"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={segments.length > 0 ? segments : [{ value: 1, color: 'hsl(var(--muted))', label: 'Vazio' }]}
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

      {/* Barra de progresso */}
      <div className="mt-4 pt-3 border-t border-border/10 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Taxa de conclusão
          </span>
          <span className="text-[10px] font-semibold tabular-nums">
            {taxaConclusao}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-700"
            style={{ width: `${taxaConclusao}%` }}
          />
        </div>
      </div>
    </WidgetContainer>
  );
}
