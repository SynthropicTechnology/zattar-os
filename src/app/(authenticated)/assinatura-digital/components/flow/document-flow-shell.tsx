"use client";

/**
 * DocumentFlowShell — Shell do fluxo de criacao/edicao/revisao de documentos.
 *
 * Alinhado ao Design System Glass Briefing:
 * - Header sticky com backdrop-blur glass
 * - Breadcrumb contextual (muda conforme a etapa)
 * - Stepper horizontal em pills glass (ativo/done/pending)
 * - Botao Voltar ghost
 * - Slot opcional `primaryAction` para acao contextual (Continuar, Finalizar...)
 * - Progress bar mobile fallback
 */

import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronRight, Upload, Settings, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Step Definitions ──────────────────────────────────────────────────

interface FlowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  pathPattern: string;
  crumb: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: "upload",
    label: "Enviar",
    icon: Upload,
    pathPattern: "/novo",
    crumb: "Novo documento",
  },
  {
    id: "configurar",
    label: "Configurar",
    icon: Settings,
    pathPattern: "/editar",
    crumb: "Configurar assinantes",
  },
  {
    id: "revisar",
    label: "Revisar",
    icon: Eye,
    pathPattern: "/revisar",
    crumb: "Revisar e enviar",
  },
];

function useCurrentFlowStep() {
  const pathname = usePathname();
  return useMemo(() => {
    const idx = FLOW_STEPS.findIndex((s) => pathname?.includes(s.pathPattern));
    return Math.max(0, idx);
  }, [pathname]);
}

// ─── Stepper pill (glass) ──────────────────────────────────────────────

function StepPill({
  step,
  index,
  currentStep,
}: {
  step: FlowStep;
  index: number;
  currentStep: number;
}) {
  const isDone = index < currentStep;
  const isCurrent = index === currentStep;

  return (
    <div
      aria-current={isCurrent ? "step" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border pl-1.5 pr-3.5 py-1 text-sm font-medium transition-all duration-200",
        isCurrent &&
          "glass-kpi border-border/50 text-foreground shadow-md",
        isDone && "border-transparent text-foreground/75",
        !isCurrent && !isDone && "border-transparent text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
          isCurrent && "bg-foreground text-background",
          isDone && "bg-success/15 text-success",
          !isCurrent && !isDone && "bg-foreground/8 text-muted-foreground",
        )}
      >
        {isDone ? <Check className="size-3.5" strokeWidth={2.5} /> : index + 1}
      </span>
      <span className={cn("hidden md:inline", index === currentStep && "inline")}>
        {step.label}
      </span>
    </div>
  );
}

function StepConnector({ done }: { done: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-px w-6 sm:w-10 transition-colors duration-300",
        done
          ? "bg-linear-to-r from-success/40 to-success/20"
          : "bg-linear-to-r from-transparent via-border/60 to-transparent",
      )}
    />
  );
}

function FlowStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav
      aria-label="Progresso do fluxo de assinatura"
      className="flex items-center gap-1"
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Etapa {currentStep + 1} de {FLOW_STEPS.length}:{" "}
        {FLOW_STEPS[currentStep]?.label}
      </div>
      {FLOW_STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-1">
          <StepPill step={step} index={idx} currentStep={currentStep} />
          {idx < FLOW_STEPS.length - 1 && (
            <StepConnector done={idx < currentStep} />
          )}
        </div>
      ))}
    </nav>
  );
}

// ─── Mobile progress ───────────────────────────────────────────────────

function FlowMobileProgress({ currentStep }: { currentStep: number }) {
  const percentage = Math.round(
    (currentStep / (FLOW_STEPS.length - 1)) * 100,
  );
  const stepLabel = FLOW_STEPS[currentStep]?.label;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Etapa {currentStep + 1} de {FLOW_STEPS.length}
        </span>
        {stepLabel && (
          <span className="text-xs font-semibold text-foreground">
            {stepLabel}
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className="h-1"
        aria-label={`Progresso: ${percentage}%`}
      />
    </div>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────────────

function FlowBreadcrumb({ currentStep }: { currentStep: number }) {
  const current = FLOW_STEPS[currentStep]?.crumb ?? "Documento";
  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground"
    >
      <span>Assinatura Digital</span>
      <ChevronRight className="size-3 opacity-40" />
      <span>Documentos</span>
      <ChevronRight className="size-3 opacity-40" />
      <span className="font-medium text-foreground">{current}</span>
    </nav>
  );
}

// ─── Main Shell ────────────────────────────────────────────────────────

interface DocumentFlowShellProps {
  children: ReactNode;
  /** Remove o padding interno do content (para canvas full-bleed) */
  fullHeight?: boolean;
  /** Acao contextual no canto direito do header (Continuar, Finalizar...) */
  primaryAction?: ReactNode;
}

export function DocumentFlowShell({
  children,
  fullHeight = false,
  primaryAction,
}: DocumentFlowShellProps) {
  const router = useRouter();
  const currentStep = useCurrentFlowStep();

  return (
    <div
      className="-m-6 flex flex-col overflow-hidden"
      style={{ height: "calc(100% + 3rem)", minHeight: "calc(100% + 3rem)" }}
    >
      {/* ── Sticky Header (glass) ─────────────────── */}
      <header className="shrink-0 z-10 border-b border-border/30 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/55">
        <div className="px-4 sm:px-6 pt-3 pb-3 space-y-2.5">
          {/* Breadcrumb */}
          <FlowBreadcrumb currentStep={currentStep} />

          {/* Top row: back + stepper + primary action */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push("/app/assinatura-digital/documentos/lista")
              }
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>

            <div className="hidden sm:flex">
              <FlowStepper currentStep={currentStep} />
            </div>

            <div className="flex items-center justify-end min-w-16 sm:min-w-32">
              {primaryAction}
            </div>
          </div>

          {/* Mobile fallback */}
          <div className="block sm:hidden">
            <FlowMobileProgress currentStep={currentStep} />
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────── */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-auto",
          !fullHeight && "p-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}
