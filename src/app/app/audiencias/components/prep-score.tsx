/**
 * PrepScore — Gauge de preparacao para audiencia
 * ============================================================================
 * Calcula e exibe um score de preparacao baseado em:
 * - Ata da audiencia anterior
 * - Documentos anexos ao processo
 * - Observacoes/anotacoes
 * - URL da sala virtual (se virtual/hibrida)
 * - Responsavel designado
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Audiencia } from "../domain";

export interface PrepScoreProps {
  audiencia: Audiencia;
  className?: string;
  /** Exibir breakdown de itens ou apenas o gauge */
  showBreakdown?: boolean;
  /** Tamanho do ring */
  size?: "sm" | "md" | "lg";
}

export interface PrepItem {
  label: string;
  done: boolean;
  weight: number;
}

export function calcPrepItems(a: Audiencia): PrepItem[] {
  const items: PrepItem[] = [
    {
      label: "Responsável designado",
      done: !!a.responsavelId,
      weight: 20,
    },
    {
      label: "Observações registradas",
      done: !!a.observacoes && a.observacoes.trim().length > 10,
      weight: 15,
    },
    {
      label: "Tipo definido",
      done: !!a.tipoAudienciaId,
      weight: 10,
    },
  ];

  // Virtual/híbrida precisa de URL
  if (a.modalidade === "virtual" || a.modalidade === "hibrida") {
    items.push({
      label: "Link da sala virtual",
      done: !!a.urlAudienciaVirtual,
      weight: 25,
    });
  }

  // Presencial/híbrida precisa de endereço
  if (a.modalidade === "presencial" || a.modalidade === "hibrida") {
    items.push({
      label: "Endereço presencial",
      done: !!a.enderecoPresencial,
      weight: 25,
    });
  }

  // Ata anterior registrada
  items.push({
    label: "Ata anterior disponível",
    done: !!a.ataAudienciaId || !!a.urlAtaAudiencia,
    weight: 30,
  });

  return items;
}

export function calcPrepScore(items: PrepItem[]): number {
  const totalWeight = items.reduce((acc, i) => acc + i.weight, 0);
  const doneWeight = items.filter((i) => i.done).reduce((acc, i) => acc + i.weight, 0);
  return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
}

function getScoreStatus(score: number): "good" | "warning" | "danger" {
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "danger";
}

const SIZE_CONFIG = {
  sm: { ring: 36, stroke: 4, text: "text-[9px]" },
  md: { ring: 48, stroke: 5, text: "text-[11px]" },
  lg: { ring: 64, stroke: 6, text: "text-sm" },
} as const;

export function PrepScore({ audiencia, className, showBreakdown = false, size = "md" }: PrepScoreProps) {
  const items = useMemo(() => calcPrepItems(audiencia), [audiencia]);
  const score = useMemo(() => calcPrepScore(items), [items]);
  const status = getScoreStatus(score);

  const cfg = SIZE_CONFIG[size];
  const radius = (cfg.ring - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const statusColors = {
    good: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    danger: "hsl(var(--destructive))",
  };

  const statusTextColors = {
    good: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/* Ring */}
      <div className="relative shrink-0" style={{ width: cfg.ring, height: cfg.ring }}>
        <svg width={cfg.ring} height={cfg.ring} className="-rotate-90">
          <circle
            cx={cfg.ring / 2}
            cy={cfg.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={cfg.stroke}
            className="text-border/15"
          />
          <circle
            cx={cfg.ring / 2}
            cy={cfg.ring / 2}
            r={radius}
            fill="none"
            stroke={statusColors[status]}
            strokeWidth={cfg.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", cfg.text, statusTextColors[status])}>{score}%</span>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="flex-1 min-w-0 space-y-1">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.done ? (
                <CheckCircle2 className="size-2.5 text-success/60 shrink-0" />
              ) : (
                <Circle className="size-2.5 text-muted-foreground/45 shrink-0" />
              )}
              <span
                className={cn(
                  "text-[10px] truncate",
                  item.done ? "text-muted-foreground/50 line-through" : "text-foreground/70",
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Versão inline compacta — apenas badge com porcentagem */
export function PrepScoreBadge({ audiencia, className }: { audiencia: Audiencia; className?: string }) {
  const items = useMemo(() => calcPrepItems(audiencia), [audiencia]);
  const score = useMemo(() => calcPrepScore(items), [items]);
  const status = getScoreStatus(score);

  const badgeStyles = {
    good: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  const Icon = status === "good" ? CheckCircle2 : status === "warning" ? AlertTriangle : AlertTriangle;

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold tabular-nums shrink-0",
      badgeStyles[status],
      className,
    )}>
      <Icon className="size-2" />
      {score}%
    </span>
  );
}
