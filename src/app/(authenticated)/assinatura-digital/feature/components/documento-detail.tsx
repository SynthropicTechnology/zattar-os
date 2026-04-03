"use client";

import {
  Camera,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  RotateCcw,
  Shield,
  Users,
  X,
} from "lucide-react";
import { GlassPanel, ProgressRing } from "@/app/(authenticated)/dashboard/mock/widgets/primitives";
import type { DocumentoCardData } from "../adapters/documento-card-adapter";
import { STATUS_CONFIG, getSignerProgress, timeAgo } from "./documento-card";

interface DocumentDetailProps {
  doc: DocumentoCardData;
  onClose: () => void;
}

export function DocumentDetail({ doc, onClose }: DocumentDetailProps) {
  const cfg = STATUS_CONFIG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);

  return (
    <GlassPanel className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`size-5 ${cfg.color}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-heading font-semibold leading-tight">
              {doc.titulo}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
              {doc.selfieHabilitada && (
                <span className="text-[8px] flex items-center gap-0.5 text-muted-foreground/55">
                  <Camera className="size-2.5" /> Selfie
                </span>
              )}
              {doc.origem === "formulario" && (
                <span className="text-[8px] flex items-center gap-0.5 text-info/40">
                  <FileText className="size-2.5" /> Formulário
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/4 transition-colors cursor-pointer"
        >
          <X className="size-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Progress */}
      {doc.assinantes.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-border/10 mb-4">
          <ProgressRing
            percent={progress.percent}
            size={48}
            color={
              progress.percent === 100
                ? "hsl(var(--success))"
                : "hsl(var(--primary))"
            }
          />
          <div>
            <p className="text-sm font-bold">
              {progress.signed}/{progress.total} assinantes
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {progress.percent === 100
                ? "Todos assinaram"
                : `${progress.total - progress.signed} pendente${progress.total - progress.signed > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      )}

      {/* Signers list */}
      <div className="mb-4">
        <h3 className="text-xs font-heading font-semibold mb-2 flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground/60" />
          Assinantes
        </h3>
        <div className="space-y-1.5">
          {doc.assinantes.map((a, i) => {
            const isDone = a.status === "concluido";
            const isLate =
              !isDone && (a.diasPendente ?? 0) > 7;

            return (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/3 transition-colors"
              >
                <div
                  className={`size-2 rounded-full shrink-0 ${
                    isDone
                      ? "bg-success/60"
                      : isLate
                        ? "bg-warning/60 animate-pulse"
                        : "bg-muted-foreground/20"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">{a.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.email && (
                      <span className="text-[9px] text-muted-foreground/55 flex items-center gap-0.5">
                        <Mail className="size-2" />
                        {a.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {isDone ? (
                    <span className="text-[9px] text-success/60 flex items-center gap-0.5">
                      <CheckCircle2 className="size-2.5" />
                      {a.concluidoEm ? timeAgo(a.concluidoEm) : "Assinado"}
                    </span>
                  ) : isLate ? (
                    <span className="text-[9px] text-warning/60">
                      {a.diasPendente}d pendente
                    </span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/55">
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {doc.assinantes.length === 0 && (
            <p className="text-[10px] text-muted-foreground/55 text-center py-4">
              Sem assinantes configurados
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">
            Criado por
          </p>
          <p className="font-medium mt-0.5">{doc.criadoPor}</p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">
            Criado em
          </p>
          <p className="font-medium mt-0.5">
            {new Date(doc.criadoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">
            Atualizado
          </p>
          <p className="font-medium mt-0.5">{timeAgo(doc.atualizadoEm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">
            Verificação
          </p>
          <p className="font-medium mt-0.5 flex items-center gap-1 text-success/60">
            <Shield className="size-2.5" /> Íntegro
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border/10">
        {doc.status === "pronto" &&
          doc.assinantes.some((a) => a.status === "pendente") && (
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning/10 text-warning/70 text-xs font-medium hover:bg-warning/15 transition-colors cursor-pointer">
              <RotateCcw className="size-3" />
              Reenviar convites
            </button>
          )}
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer">
          <ExternalLink className="size-3" />
          Ver documento
        </button>
        <button className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 hover:bg-white/6 transition-colors cursor-pointer">
          <Download className="size-3" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 hover:bg-white/6 transition-colors cursor-pointer">
          <Copy className="size-3" />
        </button>
      </div>
    </GlassPanel>
  );
}
