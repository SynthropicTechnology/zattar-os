"use client";

import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Camera,
  Users,
} from "lucide-react";
import {
  GlassPanel,
  ProgressRing,
} from "@/app/app/dashboard/mock/widgets/primitives";
import type { DocumentoCardData, DocStatus } from "../adapters/documento-card-adapter";
import { SignerPill } from "./signer-pill";

// ─── Status Config ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  DocStatus,
  {
    label: string;
    color: string;
    cssColor: string;
    icon: typeof Clock;
    bg: string;
  }
> = {
  rascunho: {
    label: "Rascunho",
    color: "text-muted-foreground/50",
    cssColor: "hsl(var(--muted-foreground) / 0.3)",
    icon: FileText,
    bg: "bg-muted-foreground/8",
  },
  pronto: {
    label: "Aguardando",
    color: "text-warning/70",
    cssColor: "hsl(var(--warning))",
    icon: Send,
    bg: "bg-warning/8",
  },
  concluido: {
    label: "Concluído",
    color: "text-success/70",
    cssColor: "hsl(var(--success))",
    icon: CheckCircle2,
    bg: "bg-success/8",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-destructive/50",
    cssColor: "hsl(var(--destructive))",
    icon: XCircle,
    bg: "bg-destructive/8",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────

export function getSignerProgress(doc: DocumentoCardData) {
  const total = doc.assinantes.length;
  const signed = doc.assinantes.filter((a) => a.status === "concluido").length;
  return { signed, total, percent: total > 0 ? Math.round((signed / total) * 100) : 0 };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d atrás`;
  return `${Math.floor(days / 7)}sem atrás`;
}

// ─── Document Card ─────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: DocumentoCardData;
  onSelect: (d: DocumentoCardData) => void;
}

export function DocumentCard({ doc, onSelect }: DocumentCardProps) {
  const cfg = STATUS_CONFIG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(
    (a) => a.status === "pendente" && (a.diasPendente ?? 0) > 7
  );

  return (
    <GlassPanel
      className={`p-4 cursor-pointer hover:scale-[1.01] ${hasPendingLong ? "ring-1 ring-warning/15" : ""}`}
    >
      <div onClick={() => onSelect(doc)}>
        <div className="flex items-start gap-3">
          <div
            className={`size-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`size-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate leading-tight">
              {doc.titulo}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
              {doc.selfieHabilitada && (
                <Camera className="size-3 text-muted-foreground/25" />
              )}
              {doc.origem === "formulario" && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-info/6 text-info/40">
                  formulário
                </span>
              )}
            </div>
          </div>
        </div>

        {doc.assinantes.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing
              percent={progress.percent}
              size={36}
              color={
                progress.percent === 100
                  ? "hsl(var(--success))"
                  : "hsl(var(--primary))"
              }
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1">
                {doc.assinantes.map((a, i) => (
                  <SignerPill key={i} assinante={a} />
                ))}
              </div>
            </div>
          </div>
        )}

        {doc.assinantes.length === 0 && doc.status === "rascunho" && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/30">
            <Users className="size-3" />
            Sem assinantes configurados
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/10">
          <span className="text-[9px] text-muted-foreground/30">
            {doc.criadoPor}
          </span>
          <span className="text-[9px] text-muted-foreground/25 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(doc.atualizadoEm)}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
