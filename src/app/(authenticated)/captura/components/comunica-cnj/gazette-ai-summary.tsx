'use client';

import { Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ComunicacaoResumo } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GazetteAiSummaryProps {
  resumo: ComunicacaoResumo | null | undefined;
  onRegenerar?: () => void;
}

// ─── Tag Color Map ───────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  prazo: 'bg-destructive/10 text-destructive',
  valor: 'bg-warning/10 text-warning',
  acao: 'bg-info/10 text-info',
  parte: 'bg-muted/30 text-muted-foreground',
};

// ─── GazetteAiSummary ──────────────────────────────────────────────────────

export function GazetteAiSummary({ resumo, onRegenerar }: GazetteAiSummaryProps) {
  if (!resumo) {
    return (
      <div className="px-4 py-3 border-b border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1.5 h-7"
          onClick={onRegenerar}
        >
          <Sparkles className="size-3" aria-hidden />
          Gerar resumo AI
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-primary/[0.02] border-b border-border/30 px-4 py-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-1.5 bg-primary/10 text-primary rounded font-medium leading-none py-0.5">
          AI
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Resumo
        </span>
      </div>

      {/* Summary text */}
      <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
        {resumo.resumo}
      </p>

      {/* Tags */}
      {resumo.tags && resumo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resumo.tags.map((tag, idx) => (
            <span
              key={`${tag.tipo}-${idx}`}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                TAG_STYLES[tag.tipo] ?? TAG_STYLES.parte,
              )}
            >
              {tag.texto}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[9px] text-muted-foreground/30">
          Gerado por AI
        </span>
        {onRegenerar && (
          <button
            type="button"
            onClick={onRegenerar}
            className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="size-2.5" aria-hidden />
            Regenerar
          </button>
        )}
      </div>
    </div>
  );
}
