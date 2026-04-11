'use client';

import * as React from 'react';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gavel,
  Lock,
  Monitor,
  CheckCircle2,
  Users,
  ChevronRight,
  Clock,
  Building2,
  Layers,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

import type { Audiencia } from '../domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  ModalidadeAudiencia,
  MODALIDADE_AUDIENCIA_LABELS,
} from '../domain';
import { calcPrepItems, calcPrepScore } from './prep-score';

// =============================================================================
// TIPOS
// =============================================================================

export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
}

interface AudienciasGlassListProps {
  audiencias: AudienciaComResponsavel[];
  isLoading: boolean;
  onView: (audiencia: AudienciaComResponsavel) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getStatusDotColor(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada:
      return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]';
    case StatusAudiencia.Finalizada:
      return 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]';
    case StatusAudiencia.Cancelada:
      return 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]';
    default:
      return 'bg-muted-foreground';
  }
}

function getModalidadeIcon(modalidade: ModalidadeAudiencia | null) {
  switch (modalidade) {
    case ModalidadeAudiencia.Virtual:
      return Monitor;
    case ModalidadeAudiencia.Presencial:
      return Building2;
    case ModalidadeAudiencia.Hibrida:
      return Layers;
    default:
      return Monitor;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

function formatCountdown(dataInicio: string): { text: string; isUrgent: boolean } | null {
  const target = parseISO(dataInicio);
  if (isPast(target)) return null;

  const mins = differenceInMinutes(target, new Date());
  if (mins < 0) return null;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 48) return null; // Only show countdown within 48h

  if (hours > 0) {
    return { text: `Em ${hours}h ${remainingMins}min`, isUrgent: hours < 2 };
  }
  return { text: `Em ${remainingMins}min`, isUrgent: true };
}

// =============================================================================
// PREP RING COMPONENT
// =============================================================================

function PrepRing({ audiencia }: { audiencia: Audiencia }) {
  const items = calcPrepItems(audiencia);
  const score = calcPrepScore(items);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-10 h-10">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20" cy="20" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
        />
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke={getScoreStrokeColor(score)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-600 ease-out"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className={cn(
        'absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold',
        getScoreColor(score),
      )}>
        {score}%
      </span>
    </div>
  );
}

// =============================================================================
// GLASS ROW COMPONENT
// =============================================================================

function GlassRow({
  audiencia,
  onView,
  isAlt,
}: {
  audiencia: AudienciaComResponsavel;
  onView: () => void;
  isAlt: boolean;
}) {
  const ModalidadeIcon = getModalidadeIcon(audiencia.modalidade);
  const countdown = audiencia.status === StatusAudiencia.Marcada
    ? formatCountdown(audiencia.dataInicio)
    : null;

  return (
    <button
      type="button"
      onClick={onView}
      className={cn(
        'w-full text-left rounded-[0.875rem] border border-white/[0.06] p-4 cursor-pointer',
        'transition-all duration-[180ms] ease-out',
        'hover:bg-white/[0.055] hover:border-white/[0.12] hover:scale-[1.0025] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
      )}
    >
      <div className="grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center w-10">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(audiencia.status))} />
        </div>

        {/* Main info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/[0.08] flex items-center justify-center shrink-0">
            <Gavel className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {audiencia.tipoDescricao || 'Audiência'}
              </span>
              {/* Indicador badges inline */}
              {audiencia.segredoJustica && (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                  Segredo
                </span>
              )}
              {audiencia.designada && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Designada
                </span>
              )}
              {audiencia.juizoDigital && (
                <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold">
                  <Monitor className="w-2.5 h-2.5" />
                  Digital
                </span>
              )}
              {(audiencia.poloAtivoRepresentaVarios || audiencia.poloPassivoRepresentaVarios) && (
                <span className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/[0.10] text-muted-foreground rounded px-1.5 py-0.5 text-[0.6rem] font-semibold">
                  <Users className="w-2.5 h-2.5" />
                  Litisconsórcio
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-0.5">
              {audiencia.numeroProcesso}
            </div>
            {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {audiencia.poloAtivoNome}
                {audiencia.poloAtivoRepresentaVarios && (
                  <span className="text-muted-foreground/60 font-medium"> e outros</span>
                )}
                {audiencia.poloAtivoNome && audiencia.poloPassivoNome && (
                  <span className="text-muted-foreground/60"> vs. </span>
                )}
                {audiencia.poloPassivoNome}
                {audiencia.poloPassivoRepresentaVarios && (
                  <span className="text-muted-foreground/60 font-medium"> e outros</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date/time */}
        <div className="text-right">
          <div className="text-sm font-medium">
            {format(parseISO(audiencia.dataInicio), 'dd MMM yyyy', { locale: ptBR })}
          </div>
          {audiencia.horaInicio && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {audiencia.horaInicio}
              {audiencia.horaFim && ` – ${audiencia.horaFim}`}
            </div>
          )}
        </div>

        {/* Modalidade badge */}
        <div>
          {audiencia.modalidade && (
            <span className="inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[0.7rem] font-semibold tracking-[0.04em] px-2 py-1 bg-primary/[0.12] border border-primary/20 text-primary/80">
              <ModalidadeIcon className="w-2.5 h-2.5" />
              {MODALIDADE_AUDIENCIA_LABELS[audiencia.modalidade]}
            </span>
          )}
        </div>

        {/* TRT badge */}
        <div>
          <span className="inline-flex backdrop-blur-sm rounded-lg text-[0.7rem] font-semibold tracking-[0.04em] px-2 py-1 bg-white/[0.06] border border-white/[0.10] text-muted-foreground">
            {audiencia.trt}
          </span>
        </div>

        {/* Prep score ring */}
        <div className="flex items-center justify-center">
          <PrepRing audiencia={audiencia} />
        </div>

        {/* Status / Countdown */}
        <div className="text-right">
          {countdown ? (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold',
              countdown.isUrgent ? 'text-amber-400' : 'text-emerald-400',
            )}>
              <Clock className="w-3 h-3" />
              {countdown.text}
            </span>
          ) : (
            <SemanticBadge
              category="audiencia_status"
              value={audiencia.status}
              className="text-[0.6rem]"
            >
              {STATUS_AUDIENCIA_LABELS[audiencia.status]}
            </SemanticBadge>
          )}
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
        <div key={i} className="rounded-[0.875rem] border border-white/[0.06] bg-white/[0.028] p-4">
          <div className="grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[0.625rem]" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-full mx-auto" />
            <Skeleton className="h-5 w-16 ml-auto rounded-full" />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <Gavel className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">Nenhuma audiência encontrada</p>
      <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou criar uma nova audiência</p>
    </div>
  );
}

// =============================================================================
// COLUMN HEADERS
// =============================================================================

function ColumnHeaders() {
  return (
    <div className="grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center px-4 mb-2">
      <div className="w-10" />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Audiência / Processo
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-right">
        Data
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Modalidade
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Tribunal
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-center">
        Preparo
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-right">
        Status
      </span>
      <div />
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasGlassList({
  audiencias,
  isLoading,
  onView,
}: AudienciasGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (audiencias.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      <div>
        <ColumnHeaders />
        <div className="flex flex-col gap-2">
          {audiencias.map((aud, i) => (
            <GlassRow
              key={aud.id}
              audiencia={aud}
              onView={() => onView(aud)}
              isAlt={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
