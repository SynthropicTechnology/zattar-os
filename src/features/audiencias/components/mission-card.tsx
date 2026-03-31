/**
 * MissionCard — Card hero da proxima audiencia
 * ============================================================================
 * Destaca a audiencia mais proxima com countdown em tempo real, prep score,
 * informacoes contextuais e acoes rapidas. E o componente central da
 * experiencia "Mission Control" para audiencias.
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import {
  Video,
  Building2,
  ExternalLink,
  FileText,
  Users,
  Gavel,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/app/app/dashboard/mock/widgets/primitives";
import { getSemanticBadgeVariant } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";

import type { Audiencia } from "../domain";
import { StatusAudiencia, MODALIDADE_AUDIENCIA_LABELS } from "../domain";
import { HearingCountdown } from "./hearing-countdown";
import { PrepScore, calcPrepItems, calcPrepScore } from "./prep-score";

export interface MissionCardProps {
  audiencia: Audiencia;
  onOpenProcess?: (processoId: number) => void;
  onOpenPje?: (audiencia: Audiencia) => void;
  onJoinVirtual?: (url: string) => void;
  onViewChecklist?: (audiencia: Audiencia) => void;
  className?: string;
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "default";
}

export function MissionCard({
  audiencia,
  onOpenProcess,
  onOpenPje,
  onJoinVirtual,
  onViewChecklist,
  className,
}: MissionCardProps) {
  const dataInicio = useMemo(() => parseISO(audiencia.dataInicio), [audiencia.dataInicio]);
  const dataFim = useMemo(() => parseISO(audiencia.dataFim), [audiencia.dataFim]);
  const isPast = dataFim < new Date();
  const isOngoing = dataInicio <= new Date() && dataFim >= new Date();

  const prepItems = useMemo(() => calcPrepItems(audiencia), [audiencia]);
  const prepScore = useMemo(() => calcPrepScore(prepItems), [prepItems]);

  const ModalIcon = audiencia.modalidade === "virtual" || audiencia.modalidade === "hibrida" ? Video : Building2;
  const modalidadeLabel = audiencia.modalidade ? MODALIDADE_AUDIENCIA_LABELS[audiencia.modalidade] : null;

  // Quick actions
  const actions = useMemo(() => {
    const list: QuickAction[] = [];

    if (audiencia.urlAudienciaVirtual && (audiencia.modalidade === "virtual" || audiencia.modalidade === "hibrida")) {
      list.push({
        label: "Entrar na sala",
        icon: Video,
        onClick: () => onJoinVirtual?.(audiencia.urlAudienciaVirtual!),
        variant: isOngoing ? "primary" : "default",
      });
    }

    list.push({
      label: "Ver processo",
      icon: FileText,
      onClick: () => onOpenProcess?.(audiencia.processoId),
    });

    list.push({
      label: "Abrir PJe",
      icon: ExternalLink,
      onClick: () => onOpenPje?.(audiencia),
    });

    list.push({
      label: "Checklist",
      icon: Users,
      onClick: () => onViewChecklist?.(audiencia),
    });

    return list;
  }, [audiencia, isOngoing, onOpenProcess, onOpenPje, onJoinVirtual, onViewChecklist]);

  return (
    <GlassPanel depth={3} className={cn("relative overflow-hidden", className)}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative p-4 sm:p-5">
        {/* Header: Status + Countdown */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gavel className="size-3.5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/60">
                  {isOngoing ? "Em andamento" : isPast ? "Concluída" : "Próxima missão"}
                </span>
                {isOngoing && (
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                )}
              </div>
              <h3 className="text-base font-heading font-semibold tracking-tight mt-0.5">
                {audiencia.tipoDescricao || "Audiência"}
              </h3>
            </div>
          </div>

          {/* Countdown */}
          {!isPast && (
            <HearingCountdown targetDate={dataInicio} />
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Time */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Horário</span>
            <span className="text-sm font-medium tabular-nums">
              {format(dataInicio, "HH:mm", { locale: ptBR })} – {format(dataFim, "HH:mm", { locale: ptBR })}
            </span>
          </div>

          {/* Tribunal */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Tribunal</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{audiencia.trt || "–"}</span>
              {audiencia.grau && (
                <span className="text-[9px] text-muted-foreground/60">{audiencia.grau === "primeiro_grau" ? "1º grau" : audiencia.grau === "segundo_grau" ? "2º grau" : "Superior"}</span>
              )}
            </div>
          </div>

          {/* Processo */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Processo</span>
            <span className="text-[11px] font-mono text-foreground/70 tabular-nums truncate">
              {audiencia.numeroProcesso}
            </span>
          </div>

          {/* Modalidade */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Modalidade</span>
            <div className="flex items-center gap-1.5">
              <ModalIcon className="size-3 text-muted-foreground/60" />
              <span className="text-sm font-medium">{modalidadeLabel || "–"}</span>
            </div>
          </div>
        </div>

        {/* Parties */}
        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-border/5">
            <span className="text-[10px] text-foreground/60 truncate">{audiencia.poloAtivoNome || "–"}</span>
            <span className="text-[9px] text-muted-foreground/50 shrink-0">vs</span>
            <span className="text-[10px] text-foreground/60 truncate">{audiencia.poloPassivoNome || "–"}</span>
          </div>
        )}

        {/* Bottom: Prep Score + Actions */}
        <div className="flex items-end justify-between gap-4">
          {/* Prep Score */}
          <PrepScore audiencia={audiencia} size="md" showBreakdown={false} />

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer group",
                  action.variant === "primary"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/4",
                )}
              >
                <action.icon className="size-2.5" />
                <span className="hidden sm:inline">{action.label}</span>
                <ArrowRight className="size-2 opacity-0 group-hover:opacity-40 transition-opacity hidden sm:block" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
