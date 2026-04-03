"use client";

import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import type { AudienciaPortal, StatusAudienciaPortal } from "./domain";
import { Calendar, MapPin, FileText, Clock, Video } from "lucide-react";

const statusConfig: Record<
  StatusAudienciaPortal,
  { className: string; label: string }
> = {
  Agendada: {
    className: "bg-primary/10 text-primary",
    label: "Agendada",
  },
  Realizada: {
    className: "bg-emerald-500/10 text-emerald-400",
    label: "Realizada",
  },
  Adiada: {
    className: "bg-amber-500/10 text-amber-500",
    label: "Adiada",
  },
};

interface AudienciasContentProps {
  audiencias: AudienciaPortal[];
  error?: string;
}

export function AudienciasContent({
  audiencias,
  error,
}: AudienciasContentProps) {
  if (error) {
    return (
      <PageShell title="Audiências">
        <div className="text-center py-12 text-muted-foreground">
          <p>{error}</p>
        </div>
      </PageShell>
    );
  }

  if (audiencias.length === 0) {
    return (
      <PageShell title="Audiências">
        <EmptyState
          icon={Calendar}
          title="Nenhuma audiência encontrada"
          description="Não há audiências vinculadas aos seus processos."
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Audiências">
      <div className="space-y-4">
        {audiencias.map((audiencia) => {
          const status = statusConfig[audiencia.status];
          return (
            <div
              key={audiencia.id}
              className="bg-card rounded-xl p-6 border border-border flex flex-col md:flex-row md:items-center gap-6"
            >
              {/* Date block */}
              <div className="flex items-center gap-3 shrink-0 min-w-48">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {audiencia.dataHora.split(",")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    {audiencia.dataHora.split(",")[1]?.trim()}
                  </p>
                </div>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-semibold truncate">
                  {audiencia.tipo}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {audiencia.processo}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {audiencia.vara} — {audiencia.local}
                </p>
              </div>

              {/* Right: status + virtual link */}
              <div className="flex items-center gap-3 shrink-0">
                {audiencia.urlVirtual && audiencia.status === "Agendada" && (
                  <a
                    href={audiencia.urlVirtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Entrar
                  </a>
                )}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
