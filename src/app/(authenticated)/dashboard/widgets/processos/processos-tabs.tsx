'use client';

/**
 * WidgetProcessosComTabs -- Widget conectado
 * Fonte: useDashboard()
 *   - data.processos.porStatus -> Treemap (tab "status")
 *   - data.processos.porSegmento -> Treemap (tab "segmento")
 */

import { useState } from 'react';
import { Layers } from 'lucide-react';
import {
  WidgetContainer,
  TabToggle,
  Treemap,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

const TAB_OPTIONS = [
  { id: 'status', label: 'Status' },
  { id: 'segmento', label: 'Segmento' },
];

interface TreemapSegment {
  value: number;
  label: string;
  color: string;
}

export function WidgetProcessosComTabs() {
  const [activeTab, setActiveTab] = useState<string>('status');
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Proporcao de Processos"
        icon={Layers}
        subtitle="Visualizacao interativa por agrupamento"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let statusSegments: TreemapSegment[] = [];
  let segmentoSegments: TreemapSegment[] = [];

  if (isDashboardUsuario(data)) {
    const p = data.processos;

    if (p.porStatus && p.porStatus.length > 0) {
      statusSegments = p.porStatus.map((s: { count: number; status: string; tone: SemanticTone }) => ({
        value: s.count,
        label: s.status,
        color: tokenForTone(s.tone),
      }));
    }

    if (p.porSegmento && p.porSegmento.length > 0) {
      segmentoSegments = p.porSegmento.map((s: { count: number; segmento: string; tone: SemanticTone }) => ({
        value: s.count,
        label: s.segmento,
        color: tokenForTone(s.tone),
      }));
    }
  } else {
    return null;
  }

  const treemapData = activeTab === 'status' ? statusSegments : segmentoSegments;

  if (treemapData.length === 0) {
    return (
      <WidgetContainer
        title="Proporcao de Processos"
        icon={Layers}
        subtitle="Visualizacao interativa por agrupamento"
        depth={1}
        action={
          <TabToggle
            tabs={TAB_OPTIONS}
            active={activeTab}
            onChangeAction={setActiveTab}
          />
        }
      >
        <p className="text-[10px] text-muted-foreground/60">
          Dados insuficientes para a visualizacao selecionada.
        </p>
      </WidgetContainer>
    );
  }

  const total = treemapData.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Proporcao de Processos"
      icon={Layers}
      subtitle="Visualizacao interativa por agrupamento"
      depth={1}
      action={
        <TabToggle
          tabs={TAB_OPTIONS}
          active={activeTab}
          onChangeAction={setActiveTab}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <Treemap segments={treemapData} height={84} />
        {/* Legend row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {treemapData.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[9px] text-muted-foreground/50">
                {seg.label}{' '}
                <span className="text-muted-foreground/55">
                  ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
