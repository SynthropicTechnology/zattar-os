'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Database,
  Gavel,
  Layers,
  Clock,
  FileSearch,
  Users,
  FileText,
  Archive,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

import type { CapturaLog, TipoCaptura, StatusCaptura } from '../types';
import type { CapturaKpiData } from './captura-kpi-strip';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogadosMap } from '../hooks/use-advogados-map';

// =============================================================================
// TIPOS
// =============================================================================

interface CapturaGlassListProps {
  search?: string;
  filters?: { tipo: string | null; status: string | null; tribunal: string | null };
  onKpiUpdate?: (data: CapturaKpiData) => void;
  onView?: (captura: CapturaLog) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getStatusDotColor(status: StatusCaptura): string {
  switch (status) {
    case 'completed':
      return 'bg-success shadow-[0_0_6px_var(--success)]';
    case 'in_progress':
      return 'bg-info shadow-[0_0_6px_var(--info)]';
    case 'failed':
      return 'bg-destructive shadow-[0_0_6px_var(--destructive)]';
    case 'pending':
    default:
      return 'bg-muted-foreground/40';
  }
}

function getTipoIcon(tipo: TipoCaptura): LucideIcon {
  switch (tipo) {
    case 'acervo_geral':
      return Database;
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas':
      return Gavel;
    case 'combinada':
      return Layers;
    case 'timeline':
      return Clock;
    case 'pericias':
      return FileSearch;
    case 'partes':
      return Users;
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo':
      return FileText;
    case 'arquivados':
      return Archive;
    default:
      return Database;
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

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  captura,
  advogadoNome,
  onView,
  isAlt,
}: {
  captura: CapturaLog;
  advogadoNome: string | undefined;
  onView: () => void;
  isAlt: boolean;
}) {
  const TipoIcon = getTipoIcon(captura.tipo_captura);

  return (
    <button
      type="button"
      onClick={onView}
      className={cn(
        'w-full text-left rounded-2xl border border-white/[0.06] p-4 cursor-pointer',
        'transition-all duration-[180ms] ease-out',
        'hover:bg-white/[0.055] hover:border-white/[0.12] hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
      )}
    >
      <div className="grid grid-cols-[10px_1fr_120px_100px_32px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center justify-center">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(captura.status))} />
        </div>

        {/* Main info: icon + tipo + advogado */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/[0.08] flex items-center justify-center shrink-0">
            <TipoIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-semibold truncate">
              {formatarTipo(captura.tipo_captura)}
            </span>
            {advogadoNome && (
              <span className="block text-xs text-muted-foreground/55 truncate mt-0.5">
                {advogadoNome}
              </span>
            )}
          </div>
        </div>

        {/* Status badge + date + duration stacked */}
        <div className="flex flex-col items-end gap-1">
          <CapturaStatusSemanticBadge value={captura.status} className="text-[10px]" />
          <span className="text-xs text-muted-foreground/60">
            {formatarDataHora(captura.iniciado_em)}
          </span>
        </div>

        {/* Duration */}
        <div className="text-right">
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {calcularDuracao(captura)}
          </span>
        </div>

        {/* Chevron */}
        <div className="flex items-center justify-end">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.028] p-4">
          <div className="grid grid-cols-[10px_1fr_120px_100px_32px] gap-4 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[0.625rem]" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-12 ml-auto" />
            <div />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// COLUMN HEADERS
// =============================================================================

function ColumnHeaders() {
  return (
    <div className="grid grid-cols-[10px_1fr_120px_100px_32px] gap-4 items-center px-4 mb-2">
      <div />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Captura
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-right">
        Status / Início
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-right">
        Duração
      </span>
      <div />
    </div>
  );
}

// =============================================================================
// PAGINATION
// =============================================================================

function PaginationBar({
  paginacao,
  pagina,
  onPrev,
  onNext,
}: {
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
  pagina: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const inicio = (pagina - 1) * paginacao.limite + 1;
  const fim = Math.min(pagina * paginacao.limite, paginacao.total);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-muted-foreground/60">
        {paginacao.total > 0 ? `${inicio}–${fim} de ${paginacao.total}` : '0 resultados'}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={pagina <= 1}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-white/[0.08] transition-all duration-150',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hover:bg-white/[0.06] hover:border-white/[0.14]',
          )}
        >
          <ChevronLeft className="w-3 h-3" />
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={pagina >= paginacao.totalPaginas}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-white/[0.08] transition-all duration-150',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hover:bg-white/[0.06] hover:border-white/[0.14]',
          )}
        >
          Próxima
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CapturaGlassList({
  search,
  filters,
  onKpiUpdate,
  onView,
}: CapturaGlassListProps) {
  const [pagina, setPagina] = useState(1);

  const { capturas, paginacao, isLoading } = useCapturasLog({
    pagina,
    limite: 20,
    tipo_captura: (filters?.tipo as TipoCaptura) || undefined,
    status: (filters?.status as StatusCaptura) || undefined,
  });

  const { advogadosMap } = useAdvogadosMap();

  // KPI update
  useEffect(() => {
    if (!onKpiUpdate) return;
    const total = paginacao?.total ?? 0;
    const sucesso = capturas.filter((c) => c.status === 'completed').length;
    const emAndamento = capturas.filter((c) => c.status === 'in_progress').length;
    const falhas = capturas.filter((c) => c.status === 'failed').length;
    const taxaSucesso = capturas.length > 0 ? Math.round((sucesso / capturas.length) * 100) : 0;
    onKpiUpdate({ total, sucesso, emAndamento, falhas, taxaSucesso });
  }, [capturas, paginacao, onKpiUpdate]);

  // Reset page when filters change
  useEffect(() => {
    setPagina(1);
  }, [filters?.tipo, filters?.status]);

  // Client-side search filter
  const filtered = React.useMemo(() => {
    if (!search) return capturas;
    const q = search.toLowerCase();
    return capturas.filter((c) => {
      const tipoLabel = formatarTipo(c.tipo_captura).toLowerCase();
      const advogado = c.advogado_id ? (advogadosMap.get(c.advogado_id) ?? '').toLowerCase() : '';
      return tipoLabel.includes(q) || advogado.includes(q);
    });
  }, [capturas, search, advogadosMap]);

  if (isLoading) return <ListSkeleton />;

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
    <div>
      <ColumnHeaders />
      <div className="flex flex-col gap-2">
        {filtered.map((captura, i) => (
          <GlassRow
            key={captura.id}
            captura={captura}
            advogadoNome={
              captura.advogado_id ? advogadosMap.get(captura.advogado_id) : undefined
            }
            onView={() => onView?.(captura)}
            isAlt={i % 2 === 1}
          />
        ))}
      </div>
      {paginacao && paginacao.totalPaginas > 1 && (
        <PaginationBar
          paginacao={paginacao}
          pagina={pagina}
          onPrev={() => setPagina((p) => Math.max(1, p - 1))}
          onNext={() => setPagina((p) => Math.min(paginacao.totalPaginas, p + 1))}
        />
      )}
    </div>
  );
}
