'use client';

import * as React from 'react';
import {
  Database,
  Gavel,
  Layers,
  Clock,
  FileSearch,
  Users,
  FileText,
  Archive,
  Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

import type { CapturaLog, TipoCaptura, StatusCaptura } from '../types';
import type { CapturaKpiData } from './captura-kpi-strip';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogadosMap } from '../hooks/use-advogados-map';
import { useCredenciaisMap } from '../hooks/use-credenciais-map';

// =============================================================================
// HELPERS (shared with glass-list)
// =============================================================================

function getTipoIconBg(tipo: TipoCaptura): string {
  switch (tipo) {
    case 'acervo_geral': return 'bg-primary/[0.08]';
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas': return 'bg-info/[0.08]';
    case 'combinada': return 'bg-warning/[0.08]';
    case 'timeline': return 'bg-success/[0.08]';
    case 'pericias': return 'bg-destructive/[0.08]';
    case 'partes': return 'bg-primary/[0.08]';
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo': return 'bg-info/[0.08]';
    case 'arquivados': return 'bg-muted-foreground/[0.08]';
    default: return 'bg-primary/[0.08]';
  }
}

function getTipoIconColor(tipo: TipoCaptura): string {
  switch (tipo) {
    case 'acervo_geral': return 'text-primary';
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas': return 'text-info';
    case 'combinada': return 'text-warning';
    case 'timeline': return 'text-success';
    case 'pericias': return 'text-destructive';
    case 'partes': return 'text-primary';
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo': return 'text-info';
    case 'arquivados': return 'text-muted-foreground';
    default: return 'text-primary';
  }
}

function getTipoIcon(tipo: TipoCaptura): LucideIcon {
  switch (tipo) {
    case 'acervo_geral': return Database;
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas': return Gavel;
    case 'combinada': return Layers;
    case 'timeline': return Clock;
    case 'pericias': return FileSearch;
    case 'partes': return Users;
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo': return FileText;
    case 'arquivados': return Archive;
    default: return Database;
  }
}

const TIPO_LABELS: Record<TipoCaptura, string> = {
  acervo_geral: 'Acervo Geral',
  arquivados: 'Arquivados',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  partes: 'Partes',
  combinada: 'Combinada',
  audiencias_designadas: 'Audiências Designadas',
  audiencias_realizadas: 'Audiências Realizadas',
  audiencias_canceladas: 'Audiências Canceladas',
  expedientes_no_prazo: 'Expedientes no Prazo',
  expedientes_sem_prazo: 'Expedientes sem Prazo',
  pericias: 'Perícias',
  timeline: 'Timeline',
};

const GRAU_LABELS: Record<string, string> = {
  '1': '1º Grau',
  '2': '2º Grau',
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

function formatarTipo(tipo: TipoCaptura): string {
  return TIPO_LABELS[tipo] ?? tipo;
}

function formatarDataHora(iso: string): string {
  try {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${min}`;
  } catch {
    return '—';
  }
}

function calcularDuracao(captura: CapturaLog): string {
  if (!captura.concluido_em) return '—';
  try {
    const inicio = new Date(captura.iniciado_em).getTime();
    const fim = new Date(captura.concluido_em).getTime();
    const diffMs = fim - inicio;
    if (diffMs < 0) return '—';
    const totalSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) return `${mins}min ${secs}s`;
    return `${secs}s`;
  } catch {
    return '—';
  }
}

function getStatusDotColor(status: StatusCaptura): string {
  switch (status) {
    case 'completed': return 'bg-success';
    case 'in_progress': return 'bg-info';
    case 'failed': return 'bg-destructive';
    case 'pending':
    default: return 'bg-muted-foreground/40';
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface CapturaGlassCardsProps {
  search?: string;
  filters?: { tipo: string | null; status: string | null; tribunal: string | null };
  onKpiUpdate?: (data: CapturaKpiData) => void;
  onView?: (captura: CapturaLog) => void;
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

function CapturaCard({
  captura,
  advogadoNome,
  tribunalCodigo,
  grau,
  onView,
}: {
  captura: CapturaLog;
  advogadoNome: string | undefined;
  tribunalCodigo: string | undefined;
  grau: string | undefined;
  onView: () => void;
}) {
  const TipoIcon = getTipoIcon(captura.tipo_captura);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(); } }}
      className="cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all duration-200"
    >
    <GlassPanel
      depth={2}
      className="p-4 h-full"
    >
      {/* Header: Icon + Tipo + Status dot */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', getTipoIconBg(captura.tipo_captura))}>
            <TipoIcon className={cn('w-5 h-5', getTipoIconColor(captura.tipo_captura))} />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-semibold truncate">
              {formatarTipo(captura.tipo_captura)}
            </span>
            {advogadoNome && (
              <span className="text-xs text-muted-foreground/55 truncate block">
                {advogadoNome}
              </span>
            )}
          </div>
        </div>
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1', getStatusDotColor(captura.status))} />
      </div>

      <div className="border-t border-border/10 my-2" />

      {/* Details */}
      <div className="space-y-1.5">
        {/* Tribunal + Grau */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">Tribunal</span>
          <div className="flex items-center gap-1.5">
            {tribunalCodigo ? (
              <span className="text-[10px] font-semibold tabular-nums border border-border/15 bg-muted/20 text-muted-foreground px-1.5 py-0.5 rounded-[5px]">
                {tribunalCodigo}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground/30">—</span>
            )}
            {grau && (
              <span className="text-[11px] text-muted-foreground/60">
                {GRAU_LABELS[grau] ?? grau}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">Status</span>
          <CapturaStatusSemanticBadge value={captura.status} className="text-[10px]" />
        </div>

        {/* Início */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">Início</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatarDataHora(captura.iniciado_em)}
          </span>
        </div>

        {/* Duração */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">Duração</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {calcularDuracao(captura)}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="border-t border-border/10 mt-3 pt-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg py-1.5 transition-colors"
        >
          <Eye className="size-3.5" />
          Ver Detalhes
        </button>
      </div>
    </GlassPanel>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-52 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CapturaGlassCards({
  search,
  filters,
  onKpiUpdate,
  onView,
}: CapturaGlassCardsProps) {
  const [pagina, setPagina] = React.useState(1);

  const { capturas, paginacao, isLoading } = useCapturasLog({
    pagina,
    limite: 18,
    tipo_captura: (filters?.tipo as TipoCaptura) || undefined,
    status: (filters?.status as StatusCaptura) || undefined,
  });

  const { advogadosMap } = useAdvogadosMap();
  const { credenciaisMap } = useCredenciaisMap();

  const resolveTribunalGrau = React.useCallback(
    (captura: CapturaLog): { tribunal?: string; grau?: string } => {
      if (!captura.credencial_ids?.length) return {};
      for (const credId of captura.credencial_ids) {
        const info = credenciaisMap.get(credId);
        if (info) return { tribunal: info.tribunal, grau: info.grau };
      }
      return {};
    },
    [credenciaisMap]
  );

  // KPI update
  React.useEffect(() => {
    if (!onKpiUpdate) return;
    const total = paginacao?.total ?? 0;
    const sucesso = capturas.filter((c) => c.status === 'completed').length;
    const emAndamento = capturas.filter((c) => c.status === 'in_progress').length;
    const falhas = capturas.filter((c) => c.status === 'failed').length;
    const taxaSucesso = capturas.length > 0 ? Math.round((sucesso / capturas.length) * 100) : 0;
    onKpiUpdate({ total, sucesso, emAndamento, falhas, taxaSucesso });
  }, [capturas, paginacao, onKpiUpdate]);

  React.useEffect(() => {
    setPagina(1);
  }, [filters?.tipo, filters?.status, filters?.tribunal]);

  // Client-side filtering
  const filtered = React.useMemo(() => {
    let result = capturas;

    if (filters?.tribunal) {
      result = result.filter((c) => {
        const { tribunal } = resolveTribunalGrau(c);
        return tribunal === filters.tribunal;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const tipoLabel = formatarTipo(c.tipo_captura).toLowerCase();
        const advogado = c.advogado_id ? (advogadosMap.get(c.advogado_id) ?? '').toLowerCase() : '';
        const { tribunal } = resolveTribunalGrau(c);
        return tipoLabel.includes(q) || advogado.includes(q) || (tribunal?.toLowerCase().includes(q) ?? false);
      });
    }

    return result;
  }, [capturas, search, filters?.tribunal, advogadosMap, resolveTribunalGrau]);

  if (isLoading) return <CardsSkeleton />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nenhuma captura encontrada"
        description="Tente ajustar os filtros ou aguarde novas capturas serem realizadas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((captura) => {
        const { tribunal, grau } = resolveTribunalGrau(captura);
        return (
          <CapturaCard
            key={captura.id}
            captura={captura}
            advogadoNome={
              captura.advogado_id ? advogadosMap.get(captura.advogado_id) : undefined
            }
            tribunalCodigo={tribunal}
            grau={grau}
            onView={() => onView?.(captura)}
          />
        );
      })}
    </div>
  );
}
