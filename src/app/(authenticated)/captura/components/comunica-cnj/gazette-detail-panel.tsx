'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  AlertTriangle,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';
import { useGazetteStore } from './hooks/use-gazette-store';
import { GazetteAiSummary } from './gazette-ai-summary';
import { GazetteTimeline } from './gazette-timeline';
import type { TimelineItem } from './gazette-timeline';
import type { StatusVinculacao } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_BADGE_STYLES: Record<StatusVinculacao, string> = {
  vinculado: 'bg-success/10 text-success',
  pendente: 'bg-warning/10 text-warning',
  orfao: 'bg-destructive/10 text-destructive',
  irrelevante: 'bg-muted/30 text-muted-foreground',
};

const STATUS_LABELS: Record<StatusVinculacao, string> = {
  vinculado: 'Vinculado',
  pendente: 'Pendente',
  orfao: 'Órfão',
  irrelevante: 'Irrelevante',
};

// ─── GazetteDetailPanel ─────────────────────────────────────────────────────

export function GazetteDetailPanel() {
  const {
    comunicacaoSelecionada,
    detailPanelAberto,
    toggleDetailPanel,
    selecionarComunicacao,
    comunicacoes,
  } = useGazetteStore();

  const [textoExpandido, setTextoExpandido] = useState(false);

  const com = comunicacaoSelecionada;

  // ── Navigation ──────────────────────────────────────────────────────────

  const currentIndex = useMemo(() => {
    if (!com) return -1;
    return comunicacoes.findIndex((c) => c.id === com.id);
  }, [com, comunicacoes]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < comunicacoes.length - 1;

  const navigatePrev = useCallback(() => {
    if (canGoPrev) selecionarComunicacao(comunicacoes[currentIndex - 1]);
  }, [canGoPrev, comunicacoes, currentIndex, selecionarComunicacao]);

  const navigateNext = useCallback(() => {
    if (canGoNext) selecionarComunicacao(comunicacoes[currentIndex + 1]);
  }, [canGoNext, comunicacoes, currentIndex, selecionarComunicacao]);

  // ── Timeline items ────────────────────────────────────────────────────

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!com) return [];
    const sameProcItems = comunicacoes
      .filter((c) => c.numeroProcesso === com.numeroProcesso)
      .sort(
        (a, b) =>
          new Date(b.dataDisponibilizacao).getTime() -
          new Date(a.dataDisponibilizacao).getTime(),
      );

    return sameProcItems.map((c) => ({
      id: c.id,
      badge: (
        <span
          className={cn(
            'text-[9px] px-1 py-0.5 rounded font-medium',
            STATUS_BADGE_STYLES[c.statusVinculacao],
          )}
        >
          {c.tipoComunicacao ?? c.meio}
        </span>
      ),
      date: formatDate(c.dataDisponibilizacao),
      text:
        c.texto?.slice(0, 120) ??
        c.tipoComunicacao ??
        'Comunicação',
      subtext:
        c.diasParaPrazo !== null && c.diasParaPrazo <= 7
          ? `Prazo: ${c.diasParaPrazo} dias restantes`
          : undefined,
      isCurrent: c.id === com.id,
    }));
  }, [com, comunicacoes]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        'h-full border-l border-border/30 bg-background transition-all duration-300 ease-in-out overflow-hidden flex flex-col',
        detailPanelAberto ? 'w-[420px] opacity-100' : 'w-0 opacity-0',
      )}
    >
      {com && (
        <div className="flex flex-col h-full overflow-y-auto">
          {/* ── 1. Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                  STATUS_BADGE_STYLES[com.statusVinculacao],
                )}
              >
                {STATUS_LABELS[com.statusVinculacao]}
              </span>
              <span className="text-[11px] text-muted-foreground/60 truncate">
                {formatDate(com.dataDisponibilizacao)}
              </span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!canGoPrev}
                onClick={navigatePrev}
                aria-label="Comunicação anterior"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!canGoNext}
                onClick={navigateNext}
                aria-label="Próxima comunicação"
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => toggleDetailPanel(false)}
                aria-label="Fechar painel"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* ── 2. Processo ───────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-border/30">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
              Processo
            </span>
            <p className="text-[15px] font-bold tabular-nums text-foreground mt-0.5">
              {com.numeroProcessoMascara ?? com.numeroProcesso}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {com.siglaTribunal && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
                  {com.siglaTribunal}
                </span>
              )}
              {com.nomeOrgao && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground truncate max-w-[180px]">
                  {com.nomeOrgao}
                </span>
              )}
              {com.nomeClasse && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
                  {com.nomeClasse}
                </span>
              )}
            </div>
          </div>

          {/* ── 3. Partes ─────────────────────────────────────────── */}
          {((com.partesAutor?.length ?? 0) > 0 ||
            (com.partesReu?.length ?? 0) > 0) && (
            <div className="px-4 py-3 border-b border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                Partes
              </span>
              <div className="mt-1.5 space-y-1">
                {com.partesAutor?.map((nome, i) => (
                  <div key={`a-${i}`} className="flex items-center gap-2">
                    <span className="text-[9px] px-1 py-0.5 rounded font-medium bg-info/10 text-info flex-shrink-0">
                      A
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {nome}
                    </span>
                  </div>
                ))}
                {com.partesReu?.map((nome, i) => (
                  <div key={`r-${i}`} className="flex items-center gap-2">
                    <span className="text-[9px] px-1 py-0.5 rounded font-medium bg-destructive/10 text-destructive flex-shrink-0">
                      R
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {nome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Prazo Alert ────────────────────────────────────── */}
          {com.diasParaPrazo !== null &&
            com.diasParaPrazo !== undefined &&
            com.diasParaPrazo <= 7 && (
              <div className="mx-4 my-3 rounded-lg bg-destructive/[0.06] border border-destructive/15 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-destructive">
                      Prazo: {com.diasParaPrazo} dias restantes
                    </p>
                    <p className="text-[10px] text-destructive/60 mt-0.5">
                      {formatDate(com.dataDisponibilizacao)} &middot;{' '}
                      {com.tipoComunicacao ?? 'Comunicação'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* ── 5. AI Summary ─────────────────────────────────────── */}
          <GazetteAiSummary resumo={com.resumoAI} />

          {/* ── 6. Texto ──────────────────────────────────────────── */}
          {com.texto && (
            <div className="px-4 py-3 border-b border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                Texto
              </span>
              <div className="relative mt-1.5">
                <div
                  className={cn(
                    'text-[11px] text-muted-foreground leading-relaxed overflow-hidden transition-all duration-300',
                    !textoExpandido && 'max-h-[100px]',
                  )}
                >
                  {com.texto}
                </div>
                {!textoExpandido && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setTextoExpandido((v) => !v)}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors mt-1"
              >
                {textoExpandido ? 'Recolher \u25B4' : 'Expandir \u25BE'}
              </button>
            </div>
          )}

          {/* ── 7. Expediente Link ────────────────────────────────── */}
          {com.statusVinculacao === 'vinculado' && com.expedienteId && (
            <div className="px-4 py-3 border-b border-border/30">
              <GlassPanel depth={1} className="p-3 cursor-pointer hover:bg-primary/[0.03] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2 rounded-full bg-success flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        Expediente #{com.expedienteId}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50">
                        Vinculado em {formatDate(com.updatedAt)} &middot; Auto
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground/40 flex-shrink-0" />
                </div>
              </GlassPanel>
            </div>
          )}

          {/* ── 8. Process Timeline ───────────────────────────────── */}
          {timelineItems.length > 1 && (
            <div className="px-4 py-3 border-b border-border/30">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                Timeline do Processo
              </span>
              <div className="mt-2">
                <GazetteTimeline items={timelineItems} />
              </div>
            </div>
          )}

          {/* ── 9. Actions ────────────────────────────────────────── */}
          <div className="px-4 py-3 mt-auto border-t border-border/30">
            <div className="flex flex-col gap-2">
              <Button size="sm" className="w-full gap-1.5 text-xs h-8">
                <FileText className="size-3.5" aria-hidden />
                Ver Certidão PDF
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-8"
                >
                  <ExternalLink className="size-3" aria-hidden />
                  Abrir no PJE
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-8"
                >
                  <Sparkles className="size-3" aria-hidden />
                  Ver Expediente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
