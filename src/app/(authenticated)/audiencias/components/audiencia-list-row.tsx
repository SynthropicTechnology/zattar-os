/**
 * AudienciaListRow — Linha de lista no padrão ContratoListRow
 * ============================================================================
 * Exibe uma audiência em formato compacto horizontal com:
 * status dot, ícone, info principal, data/hora, modalidade, TRT, prep ring,
 * countdown/status e chevron.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  Gavel,
  Video,
  Building2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { IconContainer } from '@/components/ui/icon-container';
import type { Audiencia } from '../domain';
import { StatusAudiencia, GRAU_TRIBUNAL_LABELS } from '../domain';
import { calcPrepItems, calcPrepScore } from './prep-score';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciaListRowProps {
  audiencia: Audiencia;
  onClick?: (audiencia: Audiencia) => void;
  selected?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const MODALIDADE_ICON = {
  virtual: Video,
  presencial: Building2,
  hibrida: Sparkles,
} as const;

const MODALIDADE_LABEL = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
} as const;

function fmtTime(iso: string): string {
  try {
    return parseISO(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function getTimeUntil(iso: string): { label: string; totalMs: number } {
  try {
    const diff = parseISO(iso).getTime() - Date.now();
    if (diff <= 0) return { label: 'Passada', totalMs: 0 };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 0) return { label: `${hours}h ${minutes}min`, totalMs: diff };
    return { label: `${minutes}min`, totalMs: diff };
  } catch {
    return { label: '—', totalMs: 0 };
  }
}

function getPrepStatus(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'danger';
}

const PREP_COLORS: Record<string, string> = {
  good: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
};

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciaListRow({ audiencia, onClick, selected, className }: AudienciaListRowProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = new Date();
  const isPast = useMemo(() => {
    try { return parseISO(audiencia.dataFim) < now; } catch { return false; }
  }, [audiencia.dataFim, now]);

  const isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  const isCancelada = audiencia.status === StatusAudiencia.Cancelada;
  const prepScore = useMemo(() => calcPrepScore(calcPrepItems(audiencia)), [audiencia]);
  const prepStatus = getPrepStatus(prepScore);
  const ModalIcon = MODALIDADE_ICON[audiencia.modalidade as keyof typeof MODALIDADE_ICON] ?? Gavel;
  const modalidadeLabel = MODALIDADE_LABEL[audiencia.modalidade as keyof typeof MODALIDADE_LABEL] ?? '—';
  const timeUntil = useMemo(() => getTimeUntil(audiencia.dataInicio), [audiencia.dataInicio]);

  const statusDotColor = isFinalizada
    ? 'bg-success/50'
    : isCancelada
    ? 'bg-destructive/50'
    : isPast
    ? 'bg-muted-foreground/20'
    : 'bg-primary/50';

  // Prep ring (inline SVG)
  const ringSize = 28;
  const strokeWidth = ringSize * 0.12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (prepScore / 100) * circumference;

  return (
    <button
      onClick={() => onClick?.(audiencia)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all outline-none text-left',
        'focus-visible:ring-1 focus-visible:ring-primary/30 hover:bg-foreground/4',
        selected && 'bg-primary/6',
        (isPast || isFinalizada || isCancelada) && 'opacity-55',
        className,
      )}
    >
      {/* Status dot */}
      <div className={cn('size-2.5 rounded-full shrink-0', statusDotColor)} />

      {/* Icon */}
      <IconContainer size="md" className="bg-primary/8">
        <Gavel className="size-3.5 text-primary/50" />
      </IconContainer>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{audiencia.tipoDescricao || 'Audiência'}</p>
        <p className="text-[10px] text-muted-foreground/30 truncate">
          {audiencia.poloAtivoNome || '—'} vs {audiencia.poloPassivoNome || '—'}
        </p>
        {audiencia.orgaoJulgadorOrigem && (
          <p className="text-[9px] text-muted-foreground/25 truncate">{audiencia.orgaoJulgadorOrigem}</p>
        )}
        {audiencia.observacoes && (
          <p className="text-[9px] text-muted-foreground/25 truncate italic" title={audiencia.observacoes}>{audiencia.observacoes}</p>
        )}
      </div>

      {/* Date/Time */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-[10px] font-medium tabular-nums">
          {(() => {
            try {
              return parseISO(audiencia.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            } catch {
              return '—';
            }
          })()}
        </p>
        <p className="text-[9px] text-muted-foreground/40 tabular-nums">
          {fmtTime(audiencia.dataInicio)}
        </p>
      </div>

      {/* Modalidade */}
      <div className="flex items-center gap-1 shrink-0 md:flex w-20">
        <ModalIcon className="size-2.5 text-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground/50">{modalidadeLabel}</span>
      </div>

      {/* TRT + Grau */}
      {audiencia.trt && (
        <div className="flex items-center gap-1 shrink-0 md:flex">
          <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">
            {audiencia.trt}
          </span>
          {audiencia.grau && (
            <span className="text-[9px] text-muted-foreground/35">{GRAU_TRIBUNAL_LABELS[audiencia.grau]}</span>
          )}
        </div>
      )}

      {/* Prep ring */}
      <div className="shrink-0 w-10 flex justify-center">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/15" />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
              stroke={PREP_COLORS[prepStatus]}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'font-bold tabular-nums text-[8px]',
              prepStatus === 'good' ? 'text-success' : prepStatus === 'warning' ? 'text-warning' : 'text-destructive',
            )}>
              {prepScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Countdown or status */}
      <span className={cn(
        'text-[9px] shrink-0 w-16 text-right tabular-nums font-medium',
        isFinalizada ? 'text-success/50' :
        isCancelada ? 'text-destructive/50' :
        !isPast ? (timeUntil.totalMs <= 60 * 60 * 1000 ? 'text-warning/60' : 'text-muted-foreground/40') :
        'text-muted-foreground/25',
      )}>
        {isFinalizada ? 'Realizada' : isCancelada ? 'Cancelada' : !isPast ? timeUntil.label : 'Passada'}
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </button>
  );
}
