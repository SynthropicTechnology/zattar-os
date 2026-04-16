"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssinanteCardData } from '@/shared/assinatura-digital/adapters/documento-card-adapter';

interface SignerPillProps {
  assinante: AssinanteCardData;
}

export function SignerPill({ assinante: a }: SignerPillProps) {
  const isDone = a.status === "concluido";
  const isLate = !isDone && (a.diasPendente ?? 0) > 7;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border backdrop-blur-sm transition-colors",
        isDone && "bg-success/10 border-success/25 text-success",
        isLate && "bg-warning/10 border-warning/25 text-warning",
        !isDone && !isLate && "bg-foreground/5 border-border/40 text-muted-foreground",
      )}
    >
      {isDone ? (
        <CheckCircle2 className="size-2.5" strokeWidth={2.5} />
      ) : (
        <Clock className="size-2.5" />
      )}
      <span className="truncate max-w-20">{a.nome.split(" ")[0]}</span>
      {isLate && (
        <span className="text-[9px] font-semibold tabular-nums text-warning/80">
          {a.diasPendente}d
        </span>
      )}
    </span>
  );
}
