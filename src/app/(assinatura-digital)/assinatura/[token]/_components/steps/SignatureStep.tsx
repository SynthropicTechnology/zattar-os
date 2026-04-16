"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from '@/shared/assinatura-digital/components/signature/canvas-assinatura';
import { AssinaturaMetrics } from '@/shared/assinatura-digital/utils/signature-metrics';

export interface SignatureData {
  assinatura: string;
  metrics: AssinaturaMetrics;
  rubrica?: string;
  rubricaMetrics?: AssinaturaMetrics;
}

export interface SignatureStepProps {
  token: string;
  rubricaNecessaria: boolean;
  selfieBase64?: string;
  currentStep?: number;
  totalSteps?: number;
  onPrevious: () => void;
  onSuccess: (data: SignatureData) => Promise<void>;
  onCapture?: (data: SignatureData) => void;
  onTermosChange?: (value: boolean) => void;
}

export function SignatureStep({
  rubricaNecessaria,
  currentStep = 4,
  totalSteps = 4,
  onPrevious,
  onSuccess,
  onCapture,
  onTermosChange,
}: SignatureStepProps) {
  const [termosAceite, setTermosAceite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assinaturaVazia, setAssinaturaVazia] = useState(true);
  const [rubricaVazia, setRubricaVazia] = useState(true);

  const assinaturaRef = useRef<CanvasAssinaturaRef>(null);
  const rubricaRef = useRef<CanvasAssinaturaRef>(null);

  // Atualiza estado de vazio via callbacks do canvas (onEnd)
  const handleAssinaturaEnd = useCallback(() => {
    setAssinaturaVazia(assinaturaRef.current?.isEmpty() ?? true);
  }, []);

  const handleRubricaEnd = useCallback(() => {
    setRubricaVazia(rubricaRef.current?.isEmpty() ?? true);
  }, []);

  const handleClearAssinatura = () => {
    assinaturaRef.current?.clear();
    setAssinaturaVazia(true);
  };

  const handleClearRubrica = () => {
    rubricaRef.current?.clear();
    setRubricaVazia(true);
  };

  const handleFinalize = async () => {
    if (assinaturaRef.current?.isEmpty()) {
      toast.error("Por favor, desenhe sua assinatura para continuar.");
      return;
    }

    if (rubricaNecessaria && rubricaRef.current?.isEmpty()) {
      toast.error("Por favor, desenhe sua rubrica para continuar.");
      return;
    }

    if (!termosAceite) {
      toast.error("Por favor, aceite os termos para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const assinaturaBase64 = assinaturaRef.current?.getSignatureBase64() || "";
      const assinaturaMetrics = assinaturaRef.current?.getMetrics();
      const rubricaBase64 = rubricaNecessaria
        ? rubricaRef.current?.getSignatureBase64()
        : undefined;
      const rubricaMetrics = rubricaNecessaria
        ? rubricaRef.current?.getMetrics()
        : undefined;

      if (!assinaturaMetrics) {
        toast.error("Não foi possível capturar métricas da assinatura.");
        return;
      }

      const signatureData: SignatureData = {
        assinatura: assinaturaBase64,
        metrics: assinaturaMetrics,
        rubrica: rubricaBase64 || undefined,
        rubricaMetrics: rubricaMetrics || undefined,
      };

      if (onCapture) {
        onCapture(signatureData);
      }

      await onSuccess(signatureData);
    } catch (error) {
      console.error("Erro ao finalizar assinatura:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao finalizar assinatura."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canFinalize =
    termosAceite && !assinaturaVazia && (!rubricaNecessaria || !rubricaVazia);

  return (
    <PublicStepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Assinar Documento"
      description="Desenhe sua assinatura abaixo para confirmar o documento."
      onPrevious={onPrevious}
      isPreviousDisabled={isSubmitting}
      onNext={handleFinalize}
      isNextDisabled={!canFinalize || isSubmitting}
      nextLabel={isSubmitting ? "Finalizando..." : "Finalizar Assinatura"}
    >
      <div className="flex flex-col gap-3 sm:gap-4 h-full">
        {/* Canvas de Assinatura Principal */}
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <Label className="text-xs sm:text-sm font-medium text-foreground">
              Sua Assinatura
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAssinatura}
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
              Limpar
            </Button>
          </div>
          <div className="bg-muted dark:bg-muted/50 border-2 border-dashed border-border rounded-lg p-1.5 overflow-hidden">
            <CanvasAssinatura
              ref={assinaturaRef}
              hideClearButton
              onStrokeEnd={handleAssinaturaEnd}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Use o mouse ou toque para desenhar
          </p>
        </div>

        {/* Canvas de Rubrica (condicional) */}
        {rubricaNecessaria && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-medium text-foreground">
                Rubrica / Iniciais
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearRubrica}
                className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
                Limpar
              </Button>
            </div>
            <div className="bg-muted dark:bg-muted/50 border-2 border-dashed border-border rounded-lg p-1.5 overflow-hidden">
              <CanvasAssinatura
                ref={rubricaRef}
                hideClearButton
                onStrokeEnd={handleRubricaEnd}
              />
            </div>
          </div>
        )}

        {/* Checkbox de Termos - Compact */}
        <div className="bg-muted dark:bg-muted/30 rounded-lg border border-border p-3">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="termos-aceite"
              checked={termosAceite}
              onCheckedChange={(checked) => {
                const value = checked === true;
                setTermosAceite(value);
                onTermosChange?.(value);
              }}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor="termos-aceite"
                className="text-xs sm:text-sm font-medium text-foreground cursor-pointer"
              >
                Consentimento para Assinatura Eletrônica
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Concordo com os Termos de Serviço e consinto com o uso de
                assinaturas eletrônicas, conforme MP 2.200-2/2001.
              </p>
            </div>
          </div>
        </div>

        {/* Informação Legal */}
        <p className="text-xs text-muted-foreground text-center">
          Assinatura com validade jurídica conforme MP 2.200-2/2001
        </p>
      </div>
    </PublicStepLayout>
  );
}
