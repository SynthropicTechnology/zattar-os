'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './hooks/use-gazette-store';
import { useGazetteKeyboard } from './hooks/use-gazette-keyboard';
import { GazetteKeyboardHelp } from './gazette-keyboard-help';
import { GazetteAlertBanner } from './gazette-alert-banner';
import { GazetteAiInsights } from './gazette-ai-insights';
import { GazetteKpiStrip } from './gazette-kpi-strip';
import { GazetteSearchBar } from './gazette-search-bar';
import { GazetteSyncDialog } from './gazette-sync-dialog';
import { GazetteOrphanResolver } from './gazette-orphan-resolver';
import { EmptyFirstTime } from './gazette-empty-states';
import { GazetteViewTabs } from './gazette-view-tabs';
import { GazetteFilterBar } from './gazette-filter-bar';
import { GazetteFilterChips } from './gazette-filter-chips';
import { GazetteDataTable } from './gazette-data-table';
import { GazetteCardGrid } from './gazette-card-grid';
import { GazetteDetailPanel } from './gazette-detail-panel';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import type { StatusVinculacao } from '@/app/(authenticated)/captura/comunica-cnj/domain';
import {
  actionObterMetricas,
  actionListarComunicacoesCapturadas,
  actionListarViews,
} from '@/app/(authenticated)/captura/actions/comunica-cnj-actions';

export function GazettePage() {
  useGazetteKeyboard();

  const {
    metricas,
    comunicacoes,
    viewAtiva,
    modoVisualizacao,
    isLoading,
    setMetricas,
    setComunicacoes,
    setViews,
    setIsLoading,
  } = useGazetteStore();

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [metricasRes, comunicacoesRes, viewsRes] = await Promise.all([
          actionObterMetricas(),
          actionListarComunicacoesCapturadas({ page: 1, limit: 50 }),
          actionListarViews(),
        ]);
        if (metricasRes.success && metricasRes.data) setMetricas(metricasRes.data);
        if (comunicacoesRes.success && comunicacoesRes.data) {
          // Map raw data to enriched format with safe defaults
          const items = (comunicacoesRes.data.data ?? []).map((item) => ({
            ...item,
            statusVinculacao: (item.expedienteId ? 'vinculado' : 'orfao') as StatusVinculacao,
            diasParaPrazo: null,
            partesAutor: [] as string[],
            partesReu: [] as string[],
          }));
          setComunicacoes(items);
        }
        if (viewsRes.success && viewsRes.data) setViews(viewsRes.data);
      } catch (e) {
        console.error('Failed to load gazette data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOrphanView = viewAtiva === 'orfaos';

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header with Search + Sync */}
      <div className="px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Heading level="page">Diário Oficial</Heading>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/30 px-2 py-0.5 border border-border/20 rounded">
            Comunica CNJ
          </span>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <GazetteSearchBar />
        </div>
        <div className="flex items-center gap-3">
          <GazetteSyncDialog
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/20 text-primary text-xs"
              >
                ↻ Sincronizar
              </Button>
            }
          />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px] shadow-success/40" />
            <span className="text-[11px] text-muted-foreground/25">API ok</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {metricas && metricas.prazosCriticos > 0 && (
        <GazetteAlertBanner
          count={metricas.prazosCriticos}
          descricao="Intimações com prazo crítico"
          onVerPrazos={() => useGazetteStore.getState().setViewAtiva('prazos')}
        />
      )}

      {/* AI Insights */}
      {!isOrphanView && <GazetteAiInsights />}

      {/* KPI Strip */}
      {!isOrphanView && <GazetteKpiStrip />}

      {/* View Tabs + Filter Bar */}
      {!isOrphanView && (
        <>
          <GazetteViewTabs />
          <GazetteFilterBar />
          <GazetteFilterChips />
        </>
      )}

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isOrphanView ? (
          <GazetteOrphanResolver />
        ) : comunicacoes.length === 0 && !isLoading ? (
          <EmptyFirstTime onSync={() => useGazetteStore.getState().setIsLoading(true)} />
        ) : (
          <>
            {modoVisualizacao === 'tabela' ? <GazetteDataTable /> : <GazetteCardGrid />}
            <GazetteDetailPanel />
          </>
        )}
      </div>
      <GazetteKeyboardHelp />
    </div>
  );
}
