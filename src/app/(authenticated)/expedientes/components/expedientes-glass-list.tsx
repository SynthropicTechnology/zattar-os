'use client';

import * as React from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileSearch, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { Expediente } from '../domain';
import {
  GRAU_TRIBUNAL_LABELS,
  ORIGEM_EXPEDIENTE_LABELS,
  OrigemExpediente,
  getExpedientePartyNames,
} from '../domain';

// =============================================================================
// TYPES
// =============================================================================

interface ExpedientesGlassListProps {
  expedientes: Expediente[];
  isLoading: boolean;
  onViewDetail: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: { id: number; nome: string; email: string }[];
}

// =============================================================================
// URGENCY HELPERS
// =============================================================================

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

function getUrgencyLevel(exp: Expediente): UrgencyLevel {
  if (exp.baixadoEm) return 'ok';
  const prazo = exp.dataPrazoLegalParte;
  if (!prazo) return 'ok';
  const dias = differenceInDays(parseISO(prazo), new Date());
  if (dias < 0 || exp.prazoVencido) return 'critico';
  if (dias === 0) return 'alto';
  if (dias <= 3) return 'medio';
  return 'baixo';
}

function getDiasRestantes(exp: Expediente): number | null {
  const prazo = exp.dataPrazoLegalParte;
  if (!prazo) return null;
  return differenceInDays(parseISO(prazo), new Date());
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
};

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive shadow-[0_0_6px_var(--destructive)]',
  alto: 'bg-warning shadow-[0_0_4px_var(--warning)]',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/40',
};

// =============================================================================
// COUNTDOWN BADGE
// =============================================================================

function CountdownBadge({ dias, urgency }: { dias: number | null; urgency: UrgencyLevel }) {
  if (dias === null) return <span className="text-[11px] text-muted-foreground/40 tabular-nums">--</span>;
  const label = `${dias}d`;
  const colorMap: Record<UrgencyLevel, string> = {
    critico: 'bg-destructive/8 text-destructive',
    alto: 'bg-warning/8 text-warning',
    medio: 'bg-info/8 text-info',
    baixo: 'bg-success/6 text-success',
    ok: 'bg-muted text-muted-foreground/50',
  };
  return (
    <span className={cn('text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg text-center', colorMap[urgency])}>
      {label}
    </span>
  );
}

// =============================================================================
// COLUMN HEADERS
// =============================================================================

function ColumnHeaders() {
  return (
    <div className="grid grid-cols-[32px_2.5fr_1fr_0.8fr_0.8fr_80px_80px_40px] gap-3 items-center px-4 mb-2">
      <div />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Processo / Partes
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Prazo
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Tribunal
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Responsável
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Origem
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-center">
        Prazo
      </span>
      <div />
    </div>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  expediente,
  onViewDetail,
  isAlt,
  usuariosData,
}: {
  expediente: Expediente;
  onViewDetail: () => void;
  isAlt: boolean;
  usuariosData?: { id: number; nome: string; email: string }[];
}) {
  const urgency = getUrgencyLevel(expediente);
  const dias = getDiasRestantes(expediente);
  const partes = getExpedientePartyNames(expediente);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const origemLabel = ORIGEM_EXPEDIENTE_LABELS[expediente.origem] ?? expediente.origem;

  const responsavel = usuariosData?.find((u) => u.id === expediente.responsavelId);

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className={cn(
        'group w-full text-left rounded-2xl border border-white/[0.06] p-4 cursor-pointer',
        'transition-all duration-[180ms] ease-out',
        'hover:bg-white/[0.055] hover:border-white/[0.12] hover:scale-[1.003] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className="grid grid-cols-[32px_2.5fr_1fr_0.8fr_0.8fr_80px_80px_40px] gap-3 items-center">
        {/* 1. Urgency dot */}
        <div className="flex items-center justify-center">
          <div className={cn('w-2 h-2 rounded-full shrink-0', URGENCY_DOT[urgency])} />
        </div>

        {/* 2. Main cell: processo + partes */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tabular-nums truncate">
              {expediente.numeroProcesso}
            </span>
            {urgency === 'critico' && !expediente.baixadoEm && (
              <span className="inline-flex items-center bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0">
                Vencido
              </span>
            )}
          </div>
          {(partes.autora || partes.re) && (
            <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
              {partes.autora}
              {partes.autora && partes.re && (
                <span className="text-muted-foreground/40"> vs. </span>
              )}
              {partes.re}
            </div>
          )}
        </div>

        {/* 3. Prazo date + ciencia */}
        <div className="min-w-0">
          {expediente.dataPrazoLegalParte ? (
            <>
              <div className="text-[11px] tabular-nums">
                {format(parseISO(expediente.dataPrazoLegalParte), 'dd MMM yyyy', { locale: ptBR })}
              </div>
              {expediente.dataCienciaParte && (
                <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                  Ciência: {format(parseISO(expediente.dataCienciaParte), 'dd/MM/yy')}
                </div>
              )}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">Sem prazo</span>
          )}
        </div>

        {/* 4. TRT + Grau */}
        <div className="flex flex-col gap-1 min-w-0">
          <SemanticBadge category="tribunal" value={expediente.trt} className="text-[10px] w-fit">
            {expediente.trt}
          </SemanticBadge>
          <SemanticBadge category="grau" value={expediente.grau} className="text-[10px] w-fit">
            {grauLabel}
          </SemanticBadge>
        </div>

        {/* 5. Responsavel */}
        <div className="flex items-center gap-2 min-w-0">
          {responsavel ? (
            <>
              <div className="w-[22px] h-[22px] rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-semibold text-primary">
                  {responsavel.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] truncate">{responsavel.nome}</span>
            </>
          ) : (
            <span className="text-[11px] text-destructive/70 italic">Sem responsável</span>
          )}
        </div>

        {/* 6. Origem badge */}
        <div>
          <span
            className={cn(
              'inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md',
              expediente.origem === OrigemExpediente.CAPTURA
                ? 'bg-info/8 text-info'
                : expediente.origem === OrigemExpediente.COMUNICA_CNJ
                  ? 'bg-warning/8 text-warning'
                  : 'bg-muted text-muted-foreground/60',
            )}
          >
            {origemLabel}
          </span>
        </div>

        {/* 7. Countdown badge */}
        <div className="flex items-center justify-center">
          <CountdownBadge dias={dias} urgency={urgency} />
        </div>

        {/* 8. Chevron */}
        <div className="flex items-center justify-end">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.028] p-4">
          <div className="grid grid-cols-[32px_2.5fr_1fr_0.8fr_0.8fr_80px_80px_40px] gap-3 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-[22px] h-[22px] rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-10 rounded-lg mx-auto" />
            <div />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function GlassEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <FileSearch className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">Nenhum expediente encontrado</p>
      <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou criar um novo expediente</p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExpedientesGlassList({
  expedientes,
  isLoading,
  onViewDetail,
  usuariosData,
}: ExpedientesGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (expedientes.length === 0) return <GlassEmptyState />;

  return (
    <div>
      <ColumnHeaders />
      <div className="flex flex-col gap-2">
        {expedientes.map((exp, i) => (
          <GlassRow
            key={exp.id}
            expediente={exp}
            onViewDetail={() => onViewDetail(exp)}
            isAlt={i % 2 === 1}
            usuariosData={usuariosData}
          />
        ))}
      </div>
    </div>
  );
}
