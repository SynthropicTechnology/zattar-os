"use client";

import * as React from "react";
import { Check } from "lucide-react";

export interface PublicStepIndicatorStep {
  label: string;
  description: string;
  icon?: string;
  status: "completed" | "current" | "pending";
}

export interface PublicStepIndicatorProps {
  steps: PublicStepIndicatorStep[];
}

export function PublicStepIndicator({ steps }: PublicStepIndicatorProps) {
  return (
    <div className="relative pl-2" role="list" aria-label="Etapas do processo">
      {/* Connecting Line */}
      <div
        className="absolute left-[15px] top-2 bottom-6 w-px bg-border"
        aria-hidden="true"
      />

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex gap-4"
            role="listitem"
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {/* Step Indicator Circle */}
            <div className="relative z-10 flex-shrink-0">
              {step.status === "completed" ? (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <Check
                    className="h-4 w-4 text-primary-foreground"
                    aria-label="Concluído"
                  />
                </div>
              ) : step.status === "current" ? (
                <div className="h-7 w-7 rounded-full border-2 border-primary bg-card flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full border-2 border-border bg-card flex items-center justify-center">
                  {step.icon ? (
                    <span
                      className="material-symbols-outlined text-sm text-muted-foreground"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">
                      {index + 1}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5">
              <h3
                className={`text-sm font-medium ${
                  step.status === "completed"
                    ? "text-foreground"
                    : step.status === "current"
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
