"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Camera, PenLine } from "lucide-react";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import { PublicDocumentCard } from "../shared/PublicDocumentCard";
import { Heading } from "@/components/ui/typography";

export interface WelcomeStepProps {
  documento: {
    titulo?: string | null;
    pdf_original_url: string;
  };
  selfieHabilitada?: boolean;
  onNext: () => void;
}

/**
 * Extrai o nome do arquivo da URL do PDF
 */
function extractFileName(url: string, fallbackTitle?: string | null): string {
  if (fallbackTitle) return fallbackTitle;

  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const filename = pathname.split("/").pop() || "Documento.pdf";
    const withoutUuid = filename.replace(/^[a-f0-9-]{36}_/i, "");
    return decodeURIComponent(withoutUuid);
  } catch {
    return "Documento.pdf";
  }
}

interface StepItem {
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function WelcomeStep({ documento, selfieHabilitada = false, onNext }: WelcomeStepProps) {
  const fileName = extractFileName(documento.pdf_original_url, documento.titulo);
  const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  // Steps dinâmicos baseados na configuração
  const steps: StepItem[] = [
    {
      label: "Confirmar dados",
      description: "Verifique suas informações pessoais.",
      icon: <User className="h-4 w-4" />,
    },
    ...(selfieHabilitada
      ? [
          {
            label: "Verificação por foto",
            description: "Tire uma selfie rápida para segurança.",
            icon: <Camera className="h-4 w-4" />,
          },
        ]
      : []),
    {
      label: "Assinar documento",
      description: "Aplique sua assinatura digital.",
      icon: <PenLine className="h-4 w-4" />,
    },
  ];

  return (
    <PublicStepLayout
      hideProgress={true}
      currentStep={0}
      totalSteps={3}
      title="Revisar e Assinar"
      description="Revise os detalhes do documento abaixo antes de prosseguir com a assinatura digital."
      nextLabel="Iniciar Assinatura"
      onNext={onNext}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Document Card */}
        <PublicDocumentCard
          fileName={fileName}
          sender="Zattar Advogados"
          date={formattedDate}
        />

        {/* Steps List */}
        <div className="space-y-2 sm:space-y-3">
          <Heading level="card" className="text-xs sm:text-sm text-foreground">
            O que você precisará fazer:
          </Heading>
          <div className="bg-muted dark:bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
            <div className="space-y-3" role="list" aria-label="Etapas do processo">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                  role="listitem"
                >
                  <div className="shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-border bg-card flex items-center justify-center text-muted-foreground">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <Heading level="subsection" className="text-xs sm:text-sm text-foreground">
                      {step.label}
                    </Heading>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicStepLayout>
  );
}
