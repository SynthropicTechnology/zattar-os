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
  Clock,
  Building2,
  Layers,
  Video,
  Pencil,
  Check,
  X,
  Link as LinkIcon,
  MessageSquare,
  Loader2,
  Copy,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

import type { Audiencia } from '../domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  ModalidadeAudiencia,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
} from '../domain';
import { actionAtualizarObservacoes } from '../actions';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
import { calcPrepItems, calcPrepScore } from './prep-score';

// =============================================================================
// TIPOS
// =============================================================================

export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
}

interface UsuarioOption {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

interface AudienciasGlassListProps {
  audiencias: AudienciaComResponsavel[];
  isLoading: boolean;
  onView: (audiencia: AudienciaComResponsavel) => void;
  usuarios: UsuarioOption[];
}

// =============================================================================
// HELPERS
// =============================================================================

function getModalidadeIcon(modalidade: ModalidadeAudiencia | null) {
  switch (modalidade) {
    case ModalidadeAudiencia.Virtual:
      return Video;
    case ModalidadeAudiencia.Presencial:
      return Building2;
    case ModalidadeAudiencia.Hibrida:
      return Layers;
    default:
      return Monitor;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--destructive)';
}

function formatCountdown(dataInicio: string): { text: string; isUrgent: boolean } | null {
  const target = parseISO(dataInicio);
  if (isPast(target)) return null;

  const mins = differenceInMinutes(target, new Date());
  if (mins < 0) return null;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 48) return null;

  if (hours > 0) {
    return { text: `${hours}h ${remainingMins}min`, isUrgent: hours < 2 };
  }
  return { text: `${remainingMins}min`, isUrgent: true };
}

// =============================================================================
// PREP RING
// =============================================================================

function PrepRing({ audiencia }: { audiencia: Audiencia }) {
  const items = calcPrepItems(audiencia);
  const score = calcPrepScore(items);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-11 h-11">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
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
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums',
          getScoreColor(score)
        )}
      >
        {score}%
      </span>
    </div>
  );
}

// =============================================================================
// ROW COMPONENT
// =============================================================================

function GlassRow({
  audiencia,
  onView,
  usuarios,
}: {
  audiencia: AudienciaComResponsavel;
  onView: () => void;
  usuarios: UsuarioOption[];
}) {
  const [editingObs, setEditingObs] = React.useState(false);
  const [obsDraft, setObsDraft] = React.useState('');
  const [savingObs, setSavingObs] = React.useState(false);
  const [obsValue, setObsValue] = React.useState<string | null>(audiencia.observacoes ?? null);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  React.useEffect(() => {
    setObsValue(audiencia.observacoes ?? null);
  }, [audiencia.observacoes]);

  const ModalidadeIcon = getModalidadeIcon(audiencia.modalidade);
  const countdown =
    audiencia.status === StatusAudiencia.Marcada ? formatCountdown(audiencia.dataInicio) : null;

  const dataInicio = parseISO(audiencia.dataInicio);

  const poloAtivo =
    audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—';
  const poloPassivo =
    audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—';
  const orgaoJulgador =
    audiencia.orgaoJulgadorDescricao ||
    audiencia.orgaoJulgadorOrigem ||
    null;

  const handleStartObs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setObsDraft(obsValue ?? '');
    setEditingObs(true);
  };

  const handleCancelObs = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingObs(false);
  };

  const handleSaveObs = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavingObs(true);
    const result = await actionAtualizarObservacoes(audiencia.id, obsDraft || null);
    if (result.success) {
      setObsValue(obsDraft || null);
      setEditingObs(false);
    }
    setSavingObs(false);
  };

  const handleCopyUrl = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // silencioso
    }
  };

  const handleCardClick = () => {
    if (editingObs) return;
    onView();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !editingObs) {
          e.preventDefault();
          onView();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border border-border/60 bg-card p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div className="flex items-start gap-4">
        {/* DATA + HORA + PREP RING (coluna fixa à esquerda) */}
        <div className="flex flex-col items-center gap-1.5 w-22 shrink-0 pt-0.5">
          <div className="text-center">
            <div className="text-[11.5px] font-semibold text-foreground leading-tight whitespace-nowrap">
              {format(dataInicio, 'dd MMM yyyy', { locale: ptBR })}
            </div>
            {audiencia.horaInicio && (
              <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {audiencia.horaInicio.substring(0, 5).replace(':', 'h')}
              </div>
            )}
          </div>
          <PrepRing audiencia={audiencia} />
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">
          {/* Linha 1: modalidade badge + status à direita */}
          <div className="flex items-center gap-2">
            {audiencia.modalidade && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-[0.02em] text-primary">
                <ModalidadeIcon className="w-2.5 h-2.5" />
                {MODALIDADE_AUDIENCIA_LABELS[audiencia.modalidade]}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {countdown ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-semibold',
                    countdown.isUrgent ? 'text-warning' : 'text-success'
                  )}
                >
                  <Clock className="w-3 h-3" />
                  {countdown.text}
                </span>
              ) : (
                <SemanticBadge
                  category="audiencia_status"
                  value={audiencia.status}
                  className="text-[10px]"
                >
                  {STATUS_AUDIENCIA_LABELS[audiencia.status]}
                </SemanticBadge>
              )}
            </div>
          </div>

          {/* Linha 2: título + partes + litisconsórcio + nº processo */}
          <div className="mt-1">
            <h3 className="text-[14px] font-semibold text-foreground leading-tight">
              {audiencia.tipoDescricao || 'Audiência'}
            </h3>
            <div className="mt-0.5 text-[12.5px] text-foreground/85 leading-snug flex flex-wrap items-baseline gap-x-0">
              <span className="font-medium">{poloAtivo}</span>
              {audiencia.poloAtivoRepresentaVarios && (
                <span className="text-muted-foreground/60"> e outros</span>
              )}
              <span className="mx-1.5 text-muted-foreground/60 font-medium">×</span>
              <span className="font-medium">{poloPassivo}</span>
              {audiencia.poloPassivoRepresentaVarios && (
                <span className="text-muted-foreground/60"> e outros</span>
              )}
              <span className="mx-2 inline-block w-0.75 h-0.75 rounded-full bg-muted-foreground/50 align-middle" />
              <span className="text-muted-foreground tabular-nums">{audiencia.numeroProcesso}</span>
              {(audiencia.poloAtivoRepresentaVarios || audiencia.poloPassivoRepresentaVarios) && (
                <span className="ml-2 inline-flex items-center gap-1 bg-muted border border-border/70 text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                  <Users className="w-2.5 h-2.5" />
                  Litisconsórcio
                </span>
              )}
            </div>
          </div>

          {/* Linha 3: TRT + grau + sala + órgão julgador + indicadores */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {audiencia.trt && (
              <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/60">
                {audiencia.trt}
              </span>
            )}
            {audiencia.grau && (
              <span className="inline-flex items-center rounded bg-muted border border-border/50 px-1.5 py-px text-[9px] font-semibold text-muted-foreground">
                {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
              </span>
            )}
            {audiencia.salaAudienciaNome && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60">
                  {audiencia.salaAudienciaNome}
                </span>
              </>
            )}
            {orgaoJulgador && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-[11px] text-muted-foreground/50">{orgaoJulgador}</span>
              </>
            )}
            {audiencia.segredoJustica && (
              <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                <Lock className="w-2.5 h-2.5" />
                Segredo
              </span>
            )}
            {audiencia.juizoDigital && (
              <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                <Monitor className="w-2.5 h-2.5" />
                Digital
              </span>
            )}
            {audiencia.designada && (
              <span className="inline-flex items-center gap-1 bg-success/10 border border-success/25 text-success rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Designada
              </span>
            )}
          </div>

          {/* Barra meta: obs à esquerda + responsável à direita */}
          <div
            className="mt-2.5 pt-2.5 border-t border-border/50"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {editingObs ? (
              <div className="space-y-1.5">
                <Textarea
                  value={obsDraft}
                  onChange={(e) => setObsDraft(e.target.value)}
                  placeholder="Anotações sobre a audiência..."
                  rows={2}
                  className="text-[12px]"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelObs}
                    className="h-6 text-[11px] px-2"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveObs}
                    disabled={savingObs}
                    className="h-6 text-[11px] px-2"
                  >
                    {savingObs ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                {/* Esquerda: link virtual + observações */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {audiencia.urlAudienciaVirtual && (
                    <div className="inline-flex items-center gap-1.5 min-w-0 max-w-48">
                      <LinkIcon className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      <a
                        href={audiencia.urlAudienciaVirtual}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11.5px] text-primary truncate hover:underline"
                        title={audiencia.urlAudienciaVirtual}
                      >
                        {audiencia.urlAudienciaVirtual.replace(/^https?:\/\//, '')}
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUrl(e, audiencia.urlAudienciaVirtual!)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Copiar link"
                      >
                        {copiedUrl ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStartObs}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-1.5 py-1 -mx-1.5 -my-1 text-left',
                      'transition-colors cursor-pointer hover:bg-muted/60',
                      obsValue ? 'text-foreground/75' : 'text-muted-foreground/60'
                    )}
                  >
                    <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                    <span className="text-[11.5px] flex-1 line-clamp-1 leading-snug">
                      {obsValue || 'Adicionar observações'}
                    </span>
                    <Pencil className="w-2.5 h-2.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Direita: responsável */}
                <AudienciaResponsavelPopover
                  audienciaId={audiencia.id}
                  responsavelId={audiencia.responsavelId}
                  usuarios={usuarios}
                >
                  <ResponsavelTriggerContent
                    responsavelId={audiencia.responsavelId}
                    usuarios={usuarios}
                    size="sm"
                  />
                </AudienciaResponsavelPopover>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2 w-21 shrink-0">
              <Skeleton className="w-11 h-11 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-8 w-full" />
            </div>
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
      <p className="text-xs text-muted-foreground/30 mt-1">
        Tente ajustar os filtros ou criar uma nova audiência
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasGlassList({ audiencias, isLoading, onView, usuarios }: AudienciasGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (audiencias.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {audiencias.map((aud) => (
          <GlassRow key={aud.id} audiencia={aud} onView={() => onView(aud)} usuarios={usuarios} />
        ))}
      </div>
    </TooltipProvider>
  );
}
