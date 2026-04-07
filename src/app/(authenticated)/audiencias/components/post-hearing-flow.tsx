/**
 * PostHearingFlow — Transicao pos-audiencia com checklist
 * ============================================================================
 * Quando uma audiencia passa, este card aparece incentivando o registro
 * imediato do resultado e follow-ups. Timer mostra tempo desde o fim.
 * ============================================================================
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Clock,
  Handshake,
  XCircle,
  RefreshCw,
  Bell,
  Upload,
} from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GlassPanel } from '@/components/shared/glass-panel';
import type { Audiencia } from "../domain";
import { StatusAudiencia } from "../domain";

export interface PostHearingFlowProps {
  audiencia: Audiencia;
  onMarkResult?: (audiencia: Audiencia, result: "acordo" | "sem_acordo" | "redesignada") => void;
  onUploadAta?: (audiencia: Audiencia) => void;
  onNotifyClient?: (audiencia: Audiencia) => void;
  className?: string;
}

type PostResult = "acordo" | "sem_acordo" | "redesignada";

interface PostAction {
  id: string;
  label: string;
  icon: typeof FileText;
  done: boolean;
}

const RESULT_OPTIONS: { value: PostResult; label: string; icon: typeof Handshake }[] = [
  { value: "acordo", label: "Acordo", icon: Handshake },
  { value: "sem_acordo", label: "Sem acordo", icon: XCircle },
  { value: "redesignada", label: "Redesignada", icon: RefreshCw },
];

export function PostHearingFlow({
  audiencia,
  onMarkResult,
  onUploadAta,
  onNotifyClient,
  className,
}: PostHearingFlowProps) {
  const [selectedResult, setSelectedResult] = useState<PostResult | null>(null);
  const [elapsedLabel, setElapsedLabel] = useState("");

  const dataFim = useMemo(() => parseISO(audiencia.dataFim), [audiencia.dataFim]);
  const isFinalized = audiencia.status === StatusAudiencia.Finalizada;

  // Elapsed time since hearing ended
  useEffect(() => {
    function update() {
      const mins = differenceInMinutes(new Date(), dataFim);
      if (mins < 60) {
        setElapsedLabel(`${mins}min`);
      } else {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setElapsedLabel(`${h}h ${m}min`);
      }
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [dataFim]);

  const postActions: PostAction[] = useMemo(() => [
    {
      id: "result",
      label: "Registrar resultado",
      icon: CheckCircle2,
      done: isFinalized || !!selectedResult,
    },
    {
      id: "ata",
      label: "Upload da ata",
      icon: Upload,
      done: !!audiencia.ataAudienciaId || !!audiencia.urlAtaAudiencia,
    },
    {
      id: "notify",
      label: "Notificar cliente",
      icon: Bell,
      done: false,
    },
  ], [isFinalized, selectedResult, audiencia.ataAudienciaId, audiencia.urlAtaAudiencia]);

  const completedCount = postActions.filter((a) => a.done).length;
  const progress = Math.round((completedCount / postActions.length) * 100);

  const handleSelectResult = (result: PostResult) => {
    setSelectedResult(result);
    onMarkResult?.(audiencia, result);
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === "ata") onUploadAta?.(audiencia);
    if (actionId === "notify") onNotifyClient?.(audiencia);
  };

  // Urgency color based on time elapsed
  const urgencyColor = useMemo(() => {
    const mins = differenceInMinutes(new Date(), dataFim);
    if (mins < 60) return "text-success/50";
    if (mins < 240) return "text-warning/60";
    return "text-destructive/60";
  }, [dataFim]);

  return (
    <GlassPanel depth={1} className={cn("relative overflow-hidden", className)}>
      {/* Subtle top accent */}
      <div className="h-px bg-linear-to-r from-transparent via-warning/20 to-transparent" />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-warning/50" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-warning/60">
              Concluída
            </span>
            <span className="text-[10px] text-muted-foreground/55">
              {audiencia.tipoDescricao} · {format(dataFim, "HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={cn("size-2.5", urgencyColor)} />
            <span className={cn("text-[10px] tabular-nums font-medium", urgencyColor)}>
              há {elapsedLabel}
            </span>
          </div>
        </div>

        {/* Process info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">{audiencia.numeroProcesso}</span>
          {audiencia.trt && (
            <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
          )}
        </div>

        {/* Parties */}
        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <p className="text-[10px] text-foreground/50 mb-4 truncate">
            {audiencia.poloAtivoNome || "–"} <span className="text-muted-foreground/50">vs</span> {audiencia.poloPassivoNome || "–"}
          </p>
        )}

        {/* Result selector */}
        {!isFinalized && (
          <div className="mb-4">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Resultado</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              {RESULT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectResult(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                    selectedResult === opt.value
                      ? "border-primary/30 bg-primary/8 text-primary"
                      : "border-border/15 text-muted-foreground/50 hover:text-foreground/70 hover:border-border/25",
                  )}
                >
                  <opt.icon className="size-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Post-action checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">Ações pós-audiência</span>
            <span className="text-[9px] tabular-nums text-muted-foreground/55">{completedCount}/{postActions.length}</span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 rounded-full bg-border/8 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-success/50 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-0.5">
            {postActions.map((action) => (
              <button
                key={action.id}
                onClick={() => !action.done && handleActionClick(action.id)}
                disabled={action.done}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-all",
                  action.done
                    ? "text-muted-foreground/55"
                    : "text-foreground/60 hover:bg-foreground/[0.04] cursor-pointer",
                )}
              >
                {action.done ? (
                  <CheckCircle2 className="size-3 text-success/50 shrink-0" />
                ) : (
                  <Circle className="size-3 text-muted-foreground/45 shrink-0" />
                )}
                <span className={action.done ? "line-through" : ""}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
