"use client";

import { CheckCircle2, Clock } from "lucide-react";
import type { AssinanteCardData } from "../adapters/documento-card-adapter";

interface SignerPillProps {
  assinante: AssinanteCardData;
}

export function SignerPill({ assinante: a }: SignerPillProps) {
  const isDone = a.status === "concluido";
  const isLate = !isDone && (a.diasPendente ?? 0) > 7;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
        isDone
          ? "bg-success/6 border-success/15 text-success/60"
          : isLate
            ? "bg-warning/6 border-warning/15 text-warning/60"
            : "bg-border/6 border-border/15 text-muted-foreground/40"
      }`}
    >
      {isDone ? (
        <CheckCircle2 className="size-2.5" />
      ) : (
        <Clock className="size-2.5" />
      )}
      <span className="truncate max-w-20">{a.nome.split(" ")[0]}</span>
      {isLate && (
        <span className="text-[7px] text-warning/50">{a.diasPendente}d</span>
      )}
    </span>
  );
}
