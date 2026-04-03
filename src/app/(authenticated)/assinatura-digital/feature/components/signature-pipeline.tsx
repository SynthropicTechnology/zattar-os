"use client";

import { GitBranch } from "lucide-react";
import { GlassPanel } from "@/app/(authenticated)/dashboard/mock/widgets/primitives";
import type { DocumentosStats } from "../services/documentos.service";
import type { DocStatus } from "../adapters/documento-card-adapter";
import { STATUS_CONFIG } from "./documento-card";

interface SignaturePipelineProps {
  stats: DocumentosStats;
}

export function SignaturePipeline({ stats }: SignaturePipelineProps) {
  const stages: { status: DocStatus; count: number }[] = [
    { status: "rascunho", count: stats.rascunhos },
    { status: "pronto", count: stats.aguardando },
    { status: "concluido", count: stats.concluidos },
  ];
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="size-4 text-muted-foreground/50" />
        <h2 className="font-heading text-sm font-semibold">
          Pipeline de Assinaturas
        </h2>
        <span className="text-[10px] text-muted-foreground/55 ml-auto">
          {stats.cancelados} cancelado{stats.cancelados !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-stretch gap-3">
        {stages.map((stage, i) => {
          const cfg = STATUS_CONFIG[stage.status];
          const Icon = cfg.icon;
          const prevCount = i > 0 ? stages[i - 1].count : stage.count;
          const convRate =
            i > 0 && prevCount > 0
              ? Math.round((stage.count / prevCount) * 100)
              : null;
          const barWidth =
            maxCount > 0
              ? Math.max(15, (stage.count / maxCount) * 100)
              : 15;

          return (
            <div
              key={stage.status}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`size-3.5 ${cfg.color}`} />
                <span className="text-[10px] text-muted-foreground/50">
                  {cfg.label}
                </span>
              </div>
              <p className="font-display text-2xl font-bold">{stage.count}</p>
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: cfg.cssColor,
                  opacity: 0.5,
                }}
              />
              {convRate !== null ? (
                <span
                  className={`text-[9px] ${convRate >= 70 ? "text-success/50" : "text-warning/50"}`}
                >
                  {convRate}% conversão
                </span>
              ) : (
                <span className="text-[9px] text-transparent">-</span>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
