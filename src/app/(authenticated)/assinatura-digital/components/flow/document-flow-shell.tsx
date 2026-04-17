"use client";

/**
 * DocumentFlowShell — Shell do fluxo de criacao/edicao/revisao de documentos.
 *
 * Alinhado ao padrão de página admin do ZattarOS:
 * - Header transparente (integrado ao AmbientBackdrop global, sem "barra" glass)
 * - Stepper horizontal em pills (Enviar / Configurar / Revisar)
 * - Botão Voltar como pill com ícone e label sempre visível
 * - Slot opcional `primaryAction` para ação contextual
 * - Progress bar mobile fallback
 */

import { useRouter, usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, Check, Upload, Settings, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Step Definitions ──────────────────────────────────────────────────

interface FlowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  pathPattern: string;
}

const FLOW_STEPS: FlowStep[] = [
  { id: "upload", label: "Enviar", icon: Upload, pathPattern: "/novo" },
  { id: "configurar", label: "Configurar", icon: Settings, pathPattern: "/editar" },
  { id: "revisar", label: "Revisar", icon: Eye, pathPattern: "/revisar" },
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
      {/* Header transparente — integrado ao AmbientBackdrop global */}
      <header className="shrink-0">
        <div className="px-6 sm:px-8 pt-5 pb-4 sm:pb-5">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push("/app/assinatura-digital/documentos/lista")
              }
              className="h-10 gap-2 rounded-full border-outline-variant/40 bg-surface-container-lowest/60 px-4 text-muted-foreground backdrop-blur-sm hover:border-outline-variant/70 hover:bg-surface-container-lowest hover:text-foreground cursor-pointer transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Voltar</span>
            </Button>

            <div className="hidden sm:flex">
              <FlowStepper currentStep={currentStep} />
            </div>

            <div className="flex items-center justify-end min-w-16 sm:min-w-32">
              {primaryAction}
            </div>
          </div>

          {/* Mobile fallback */}
          <div className="mt-4 block sm:hidden">
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
