"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Lightbulb, User, CheckCircle } from "lucide-react";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import CapturaFoto, { type CapturaFotoRef } from "@/shared/assinatura-digital/components/capture/captura-foto";

export interface SelfieStepProps {
  selfieHabilitada: boolean;
  currentStep?: number;
  totalSteps?: number;
  onPrevious: () => void;
  onNext: () => void;
  onPhotoCapture?: (base64: string) => void;
}

export function SelfieStep({
  selfieHabilitada,
  currentStep = 3,
  totalSteps = 4,
  onPrevious,
  onNext,
  onPhotoCapture,
}: SelfieStepProps) {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const capturaFotoRef = useRef<CapturaFotoRef>(null);

  const handlePhotoCapture = (base64: string) => {
    setHasPhoto(true);
    onPhotoCapture?.(base64);
  };

  const handlePhotoCleared = () => {
    setHasPhoto(false);
  };

  const handleWebcamError = (hasError: boolean) => {
    setWebcamError(hasError);
  };

  const handleNext = async () => {
    if (!selfieHabilitada || webcamError) {
      onNext();
      return;
    }

    if (!capturaFotoRef.current?.hasPhoto()) {
      toast.error("Por favor, capture uma foto para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar foto"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se selfie não é habilitada, mostra mensagem simples
  if (!selfieHabilitada) {
    return (
      <PublicStepLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        title="Verificação de Identidade"
        description="A verificação por foto não é necessária para este documento."
        onPrevious={onPrevious}
        onNext={onNext}
        nextLabel="Continuar"
        previousLabel="Voltar"
      >
        <div className="flex flex-col items-center justify-center py-6 sm:py-8">
          <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-success/10 text-success mb-3">
            <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Você pode prosseguir para a etapa de assinatura.
          </p>
        </div>
      </PublicStepLayout>
    );
  }

  return (
    <PublicStepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Verificação de Identidade"
      description="Confirme sua identidade para prosseguir com a assinatura."
      onPrevious={onPrevious}
      onNext={handleNext}
      nextLabel="Continuar"
      previousLabel="Voltar"
      isNextDisabled={!hasPhoto && !webcamError}
      isLoading={isSubmitting}
    >
      <div className="flex flex-col gap-3 h-full">
        {/* Captura de Foto - takes available space */}
        <div className="max-w-xs mx-auto w-full flex-1 min-h-0">
          <CapturaFoto
            ref={capturaFotoRef}
            onWebcamErrorChange={handleWebcamError}
            onPhotoCaptured={handlePhotoCapture}
            onPhotoCleared={handlePhotoCleared}
          />
        </div>

        {/* Dicas inline - minimal, não compete com a câmera */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-warning" aria-hidden="true" />
            Boa iluminação
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-info" aria-hidden="true" />
            Olhe para a câmera
          </span>
        </div>

        {/* Aviso de erro na webcam */}
        {webcamError && (
          <div className="bg-warning/5 border border-warning/15 rounded-lg p-2.5 text-center">
            <p className="text-xs text-warning">
              Câmera indisponível. Você pode continuar sem a verificação por foto.
            </p>
          </div>
        )}
      </div>
    </PublicStepLayout>
  );
}
