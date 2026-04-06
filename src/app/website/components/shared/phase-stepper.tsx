import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface PhaseStep {
  label: string;
  status: "completed" | "current" | "pending";
}

interface PhaseStepperProps {
  steps: PhaseStep[];
  className?: string;
}

/**
 * Horizontal phase stepper — shows process phases (Inicial → Citação → Instrução → Sentença)
 * with connecting progress lines and status indicators.
 */
export function PhaseStepper({ steps, className }: PhaseStepperProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className={cn("flex items-center", !isLast && "flex-1")}>
            {/* Dot */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                  step.status === "completed" &&
                    "bg-primary text-on-primary-fixed shadow-[0_0_10px_rgb(var(--color-primary)/0.4)]",
                  step.status === "current" &&
                    "bg-primary/20 text-primary ring-2 ring-primary/40 shadow-[0_0_10px_rgb(var(--color-primary)/0.3)]",
                  step.status === "pending" &&
                    "bg-surface-container-highest text-on-surface-variant"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                  step.status === "completed" && "text-primary",
                  step.status === "current" && "text-primary",
                  step.status === "pending" && "text-on-surface-variant/50"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div className="flex-1 mx-2 h-0.5 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-surface-container-highest" />
                {(step.status === "completed" ||
                  (step.status === "current" && steps[i + 1]?.status !== "pending")) && (
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500",
                      step.status === "completed" ? "w-full" : "w-1/2"
                    )}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
