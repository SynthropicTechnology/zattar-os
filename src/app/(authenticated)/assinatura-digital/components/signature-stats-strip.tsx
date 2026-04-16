"use client";

import { FileSignature } from "lucide-react";
import {
  GlassPanel,
  ProgressRing,
  AnimatedNumber,
  Sparkline,
} from "@/app/(authenticated)/dashboard/mock/widgets/primitives";
import type { DocumentosStats } from '@/shared/assinatura-digital/services/documentos.service';

interface SignatureStatsStripProps {
  stats: DocumentosStats;
}

export function SignatureStatsStrip({ stats }: SignatureStatsStripProps) {
  const trendDelta =
    stats.trendMensal.length >= 2
      ? stats.trendMensal[stats.trendMensal.length - 1] -
        stats.trendMensal[stats.trendMensal.length - 2]
      : 0;

  return (
    <GlassPanel className="px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* Total */}
        <div className="flex items-center gap-2 shrink-0">
          <FileSignature className="size-4 text-muted-foreground/55" />
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Total
            </p>
            <p className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={stats.total} />
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Taxa Conclusão */}
        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Taxa Conclusão
          </p>
          <div className="flex items-center gap-2">
            <ProgressRing
              percent={stats.taxaConclusao}
              size={32}
              color="var(--success)"
            />
            <span className="text-xs font-bold text-success/70">
              {stats.taxaConclusao}%
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tempo Médio */}
        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Tempo Médio
          </p>
          <p className="font-display text-base font-bold tabular-nums">
            {stats.tempoMedio}d
          </p>
          <p className="text-[9px] text-muted-foreground/55">para conclusão</p>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tendência */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Tendência 6m
            </p>
            <p className="text-xs font-semibold text-success/60">
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta} este mês
            </p>
          </div>
          <Sparkline
            data={stats.trendMensal}
            width={60}
            height={20}
            color="var(--success)"
          />
        </div>
      </div>
    </GlassPanel>
  );
}
