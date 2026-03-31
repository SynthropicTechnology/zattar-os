"use client";

import { Camera, ChevronRight, FileText } from "lucide-react";
import { ProgressRing } from "@/app/app/dashboard/mock/widgets/primitives";
import type { DocumentoCardData } from "../adapters/documento-card-adapter";
import { STATUS_CONFIG, getSignerProgress, timeAgo } from "./documento-card";

interface DocumentListRowProps {
  doc: DocumentoCardData;
  onSelect: (d: DocumentoCardData) => void;
  selected: boolean;
}

export function DocumentListRow({ doc, onSelect, selected }: DocumentListRowProps) {
  const cfg = STATUS_CONFIG[doc.status];
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(
    (a) => a.status === "pendente" && (a.diasPendente ?? 0) > 7
  );

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all
        ${
          selected
            ? "bg-primary/6 border border-primary/15"
            : `hover:bg-white/4 border border-transparent ${hasPendingLong ? "ring-1 ring-warning/10" : ""}`
        }`}
    >
      <div
        className={`size-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}
      >
        <cfg.icon className={`size-3.5 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{doc.titulo}</p>
        <p className="text-[10px] text-muted-foreground/55">
          {doc.criadoPor} &middot; {timeAgo(doc.criadoEm)}
        </p>
      </div>

      {doc.assinantes.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <ProgressRing
            percent={progress.percent}
            size={24}
            color={
              progress.percent === 100
                ? "hsl(var(--success))"
                : "hsl(var(--primary))"
            }
          />
          <span className="text-[10px] tabular-nums text-muted-foreground/60">
            {progress.signed}/{progress.total}
          </span>
        </div>
      )}

      <span
        className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} shrink-0 hidden sm:block`}
      >
        {cfg.label}
      </span>

      <div className="items-center gap-1 shrink-0 hidden md:flex">
        {doc.selfieHabilitada && (
          <Camera className="size-3 text-muted-foreground/45" />
        )}
        {doc.origem === "formulario" && (
          <FileText className="size-3 text-info/30" />
        )}
      </div>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}
