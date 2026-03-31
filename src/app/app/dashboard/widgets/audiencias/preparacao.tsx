'use client';

/**
 * Widget: Preparação para Audiências
 * ============================================================================
 * Conectado ao hook useDashboard() → proximasAudiencias (AudienciaProxima[]).
 * Status de preparação documental não está disponível ainda — exibe as
 * próximas 3 audiências com ProgressRing em 0% e um InsightBanner informativo.
 *
 * Uso:
 *   import { WidgetPreparacao } from '@/app/app/dashboard/widgets/audiencias/preparacao'
 * ============================================================================
 */

import { Calendar, Clock, MapPin, FileText } from 'lucide-react';
import {
  ProgressRing,
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks/use-dashboard';

// Formatar data de audiência para exibição amigável
function formatarDataAudiencia(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Mapear tipo de audiência para cor de destaque
function corPorTipo(tipo: string | null): string {
  if (!tipo) return 'hsl(var(--muted-foreground) / 0.55)';
  const t = tipo.toLowerCase();
  if (t.includes('instrução') || t.includes('instrucao')) return 'hsl(var(--primary))';
  if (t.includes('conciliação') || t.includes('conciliacao')) return 'hsl(var(--warning))';
  if (t.includes('julgamento')) return 'hsl(var(--destructive))';
  return 'hsl(var(--primary) / 0.5)';
}

export function WidgetPreparacao() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = data.proximasAudiencias.slice(0, 3);

  return (
    <WidgetContainer
      title="Preparação para Audiências"
      icon={FileText}
      subtitle="Próximas 3 audiências"
      depth={1}
    >
      {audiencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-[11px] text-muted-foreground/60">
            Nenhuma audiência próxima registrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audiencias.map((audiencia) => {
            const cor = corPorTipo(audiencia.tipo_audiencia);
            return (
              <div
                key={audiencia.id}
                className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-white/4 transition-colors duration-150"
              >
                {/* Anel de preparação — 0% até integração de documentos */}
                <ProgressRing
                  percent={0}
                  size={40}
                  color={cor}
                />

                {/* Informações da audiência */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium leading-tight truncate">
                    {audiencia.tipo_audiencia ?? 'Audiência'} —{' '}
                    {audiencia.polo_ativo_nome ?? audiencia.numero_processo}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 font-mono truncate mt-0.5">
                    {audiencia.numero_processo}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                      <Calendar className="size-2.5" />
                      <span>{formatarDataAudiencia(audiencia.data_audiencia)}</span>
                    </div>
                    {audiencia.hora_audiencia && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                        <Clock className="size-2.5" />
                        <span>{audiencia.hora_audiencia}</span>
                      </div>
                    )}
                    {audiencia.local && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 truncate">
                        <MapPin className="size-2.5 shrink-0" />
                        <span className="truncate">{audiencia.local}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <InsightBanner type="info">
          Integração com documentos em desenvolvimento — status de preparação indisponível no momento.
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}
