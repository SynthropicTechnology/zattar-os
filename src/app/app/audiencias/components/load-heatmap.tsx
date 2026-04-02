/**
 * LoadHeatmap — Distribuicao e carga de audiencias
 * ============================================================================
 * Painel lateral com:
 * - Distribuicao por tipo de audiencia (horizontal bars)
 * - Carga por advogado/responsavel (barras + contagem)
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/app/app/dashboard/mock/widgets/primitives";
import type { Audiencia } from "../domain";

export interface LoadHeatmapProps {
  audiencias: Audiencia[];
  /** Map de responsavelId -> nome */
  responsavelNomes?: Map<number, string>;
  className?: string;
}

interface TypeDistribution {
  tipo: string;
  count: number;
  percent: number;
}

interface ResponsavelLoad {
  id: number;
  nome: string;
  count: number;
  percent: number;
}

export function LoadHeatmap({ audiencias, responsavelNomes, className }: LoadHeatmapProps) {
  // Type distribution
  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    audiencias.forEach((a) => {
      const tipo = a.tipoDescricao || "Não definido";
      counts.set(tipo, (counts.get(tipo) || 0) + 1);
    });

    const total = audiencias.length || 1;
    return Array.from(counts.entries())
      .map(([tipo, count]): TypeDistribution => ({
        tipo,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [audiencias]);

  // Responsavel load
  const responsavelLoad = useMemo(() => {
    const counts = new Map<number, number>();
    audiencias.forEach((a) => {
      if (a.responsavelId) {
        counts.set(a.responsavelId, (counts.get(a.responsavelId) || 0) + 1);
      }
    });

    const maxCount = Math.max(...Array.from(counts.values()), 1);
    return Array.from(counts.entries())
      .map(([id, count]): ResponsavelLoad => ({
        id,
        nome: responsavelNomes?.get(id) || `#${id}`,
        count,
        percent: Math.round((count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [audiencias, responsavelNomes]);

  const semResponsavel = audiencias.filter((a) => !a.responsavelId).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type Distribution */}
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-3 text-primary/40" />
          <span className="text-[11px] font-medium text-muted-foreground/50">Distribuição por tipo</span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 ml-auto">{audiencias.length} total</span>
        </div>

        <div className="space-y-2">
          {typeDistribution.map((item) => (
            <div key={item.tipo}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[10px] text-foreground/60 truncate max-w-[60%]">{item.tipo}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold tabular-nums">{item.count}</span>
                  <span className="text-[8px] text-muted-foreground/50 tabular-nums">{item.percent}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/30 transition-all duration-700"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Responsavel Load */}
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-3 text-primary/40" />
          <span className="text-[11px] font-medium text-muted-foreground/50">Carga por advogado</span>
        </div>

        <div className="space-y-2">
          {responsavelLoad.map((item) => (
            <div key={item.id}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[10px] text-foreground/60 truncate max-w-[60%]">{item.nome}</span>
                <span className="text-[10px] font-bold tabular-nums">{item.count}</span>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    item.percent > 80 ? "bg-destructive/40" : item.percent > 50 ? "bg-warning/40" : "bg-success/40",
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}

          {semResponsavel > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-border/8">
              <span className="text-[9px] text-warning/50">Sem responsável</span>
              <span className="text-[10px] font-bold tabular-nums text-warning/60">{semResponsavel}</span>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
