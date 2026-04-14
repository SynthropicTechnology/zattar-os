'use client';

import * as React from 'react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileSearch, ChevronRight, Lock, Monitor, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';

import {
  type Expediente,
  type UrgencyLevel,
  getExpedienteUrgencyLevel,
  GRAU_TRIBUNAL_LABELS,
  ORIGEM_EXPEDIENTE_LABELS,
  OrigemExpediente,
  getExpedientePartyNames,
} from '../domain';
import type { Usuario } from '@/app/(authenticated)/usuarios';
import {
  getExpedienteDiasRestantes,
  URGENCY_BORDER,
  URGENCY_DOT,
  URGENCY_COUNTDOWN,
} from './urgency-helpers';

// =============================================================================
// TYPES
// =============================================================================

interface ExpedientesGlassListProps {
  expedientes: Expediente[];
  isLoading: boolean;
  onViewDetail: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: Usuario[];
  tiposExpedientesData?: { id: number; tipoExpediente?: string }[];
}

// =============================================================================
// COUNTDOWN BADGE
// =============================================================================

function CountdownBadge({ dias, urgency }: { dias: number | null; urgency: UrgencyLevel }) {
  if (dias === null) return <span className="text-[11px] text-muted-foreground/40 tabular-nums">--</span>;
  const label = `${dias}d`;
  return (
    <span className={cn('text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg text-center', URGENCY_COUNTDOWN[urgency])}>
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
        Restante
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
  onBaixar,
  isAlt,
  usuariosData,
  tiposExpedientesData,
}: {
  expediente: Expediente;
  onViewDetail: () => void;
  onBaixar?: (expediente: Expediente) => void;
  isAlt: boolean;
  usuariosData?: Usuario[];
  tiposExpedientesData?: { id: number; tipoExpediente?: string }[];
}) {
  const urgency = getExpedienteUrgencyLevel(expediente);
  const dias = getExpedienteDiasRestantes(expediente);
  const partes = getExpedientePartyNames(expediente);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const origemLabel = ORIGEM_EXPEDIENTE_LABELS[expediente.origem] ?? expediente.origem;

  const responsavel = usuariosData?.find((u) => u.id === expediente.responsavelId);
  const tipoLabel = tiposExpedientesData?.find((t) => t.id === expediente.tipoExpedienteId)?.tipoExpediente;
  const orgaoJulgador = expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem;

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className={cn(
        'group w-full text-left rounded-2xl border border-white/6 p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:scale-[1.003] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className="grid grid-cols-[32px_2.5fr_1fr_0.8fr_0.8fr_80px_80px_40px] gap-3 items-center">
        {/* 1. Urgency dot */}
        <div className="flex items-center justify-center">
          <div className={cn('w-2 h-2 rounded-full shrink-0', URGENCY_DOT[urgency])} />
        </div>

        {/* 2. Main cell — stacked info */}
        <div className="min-w-0">
          {/* Title row: processo number + tipo badge + indicator badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium tabular-nums truncate">
              {expediente.numeroProcesso}
            </span>
            {/* Tipo expediente badge */}
            {tipoLabel && (
              <span className="inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0">
                {tipoLabel}
              </span>
            )}
            {urgency === 'critico' && !expediente.baixadoEm && (
              <span className="inline-flex items-center bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0">
                Vencido
              </span>
            )}
            {/* Indicator badges */}
            {expediente.segredoJustica && (
              <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning rounded px-1.5 py-0.5 text-[10px] font-semibold">
                <Lock className="w-2.5 h-2.5" />
                Segredo
              </span>
            )}
            {expediente.juizoDigital && (
              <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded px-1.5 py-0.5 text-[10px] font-semibold">
                <Monitor className="w-2.5 h-2.5" />
                Digital
              </span>
            )}
            {expediente.prioridadeProcessual && (
              <span className="inline-flex items-center gap-1 bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[10px] font-semibold">
                <AlertTriangle className="w-2.5 h-2.5" />
                Prioridade
              </span>
            )}
          </div>
          {/* Partes */}
          {(partes.autora || partes.re) && (
            <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
              {partes.autora}
              {partes.autora && partes.re && (
                <span className="text-muted-foreground/40"> vs. </span>
              )}
              {partes.re}
            </div>
          )}
          {/* Classe judicial */}
          {expediente.classeJudicial && (
            <div className="text-[10px] text-muted-foreground/45 mt-0.5 truncate">
              {expediente.classeJudicial}
            </div>
          )}
          {/* Orgao julgador */}
          {orgaoJulgador && (
            <div className="text-[10px] text-muted-foreground/45 mt-0.5 truncate" title={orgaoJulgador}>
              {orgaoJulgador}
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
                  Ciencia: {format(parseISO(expediente.dataCienciaParte), 'dd/MM/yy')}
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
              <div className="w-5.5 h-5.5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-semibold text-primary">
                  {(responsavel.nomeExibicao || responsavel.nomeCompleto).charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] truncate">{responsavel.nomeExibicao || responsavel.nomeCompleto}</span>
            </>
          ) : (
            <span className="text-[11px] text-destructive/70 italic">Sem responsavel</span>
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

        {/* 8. Actions */}
        <div className="flex items-center justify-end gap-1">
          {onBaixar && !expediente.baixadoEm && (
            <button
              onClick={(e) => { e.stopPropagation(); onBaixar(expediente); }}
              className="px-2 py-1 rounded-md bg-success/6 text-success text-[10px] font-medium hover:bg-success/12 transition-colors cursor-pointer"
            >
              Baixar
            </button>
          )}
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
        <div key={i} className="rounded-2xl border border-white/6 bg-white/[0.028] p-4">
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
              <Skeleton className="w-5.5 h-5.5 rounded-full" />
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
  onBaixar,
  usuariosData,
  tiposExpedientesData,
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
            onBaixar={onBaixar}
            isAlt={i % 2 === 1}
            usuariosData={usuariosData}
            tiposExpedientesData={tiposExpedientesData}
          />
        ))}
      </div>
    </div>
  );
}
