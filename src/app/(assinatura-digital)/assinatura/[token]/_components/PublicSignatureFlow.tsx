"use client";

import * as React from "react";
import { useMemo, useCallback, useEffect, useRef } from "react";
import { AlertCircle, RefreshCcw, FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { PublicSignatureProvider, usePublicSignature } from "./PublicSignatureContext";
import type { SignatureMetrics } from "./PublicSignatureContext";
import type { AssinaturaMetrics } from '@/shared/assinatura-digital/utils/signature-metrics';
import { PublicPageShell } from "./layout/PublicPageShell";
import {
  WelcomeStep,
  ConfirmDetailsStep,
  ReviewDocumentStep,
  SelfieStep,
  SignatureStep,
  SuccessStep,
} from "./steps";

// =============================================================================
// TIPOS
// =============================================================================

export interface PublicSignatureFlowProps {
  token: string;
}

// =============================================================================
// COMPONENTES DE ESTADO
// =============================================================================

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = "Carregando documento..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-border" />
        <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
      </div>
      <div className="text-center space-y-1.5 max-w-sm">
        <Heading level="section" className="text-base sm:text-lg text-foreground">
          Erro ao carregar
        </Heading>
        <p className="text-xs sm:text-sm text-muted-foreground">{error}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2 min-h-11">
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

function DocumentNotReadyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-highlight/10 text-highlight">
        <FileX2 className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
      </div>
      <div className="text-center space-y-1.5 max-w-sm">
        <Heading level="section" className="text-base sm:text-lg text-foreground">
          Documento indisponível
        </Heading>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Este documento ainda não está pronto para assinatura. Por favor, tente
          novamente mais tarde ou entre em contato com o remetente.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// ORQUESTRADOR INTERNO (usa o Context)
// =============================================================================

interface PublicSignatureFlowContentProps {
  token: string;
}

function PublicSignatureFlowContent({ token }: PublicSignatureFlowContentProps) {
  const {
    state,
    reloadContext,
    nextStep,
    previousStep,
    captureSelfie,
    captureSignature,
    finalizeSigning,
    setTermosAceite,
    setGeolocation,
    hasRubrica,
    isDocumentReady,
    isSignerCompleted,
  } = usePublicSignature();

  const contentRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(state.currentStep);

  // Solicita geolocalização ao montar
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
        },
        () => {
          // Silenciosamente ignora se o usuário recusar
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, [setGeolocation]);

  // Focus management ao trocar de step
  useEffect(() => {
    if (prevStepRef.current !== state.currentStep) {
      prevStepRef.current = state.currentStep;
      // Move o foco para o container do step para screen readers
      if (contentRef.current) {
        contentRef.current.focus({ preventScroll: true });
      }
    }
  }, [state.currentStep]);

  // Define os steps dinamicamente baseado no contexto
  const steps = useMemo(() => {
    if (!state.context) return [];

    const allSteps = [
      { id: "welcome", label: "Início" },
      { id: "confirm", label: "Dados" },
      { id: "review", label: "Revisão" },
      ...(state.context.documento.selfie_habilitada
        ? [{ id: "selfie", label: "Selfie" }]
        : []),
      { id: "signature", label: "Assinatura" },
    ];

    return allSteps;
  }, [state.context]);

  // Total de steps para a barra de progresso (sem contar Welcome que esconde)
  const totalSteps = steps.length - 1; // -1 porque Welcome não mostra progress

  // Índice do step atual ajustado para steps dinâmicos
  const currentStepId = useMemo(() => {
    return steps[state.currentStep]?.id ?? "welcome";
  }, [steps, state.currentStep]);

  // Step number para a progress bar (1-based, sem contar Welcome)
  const displayStepNumber = Math.max(0, state.currentStep);

  const selfieHabilitada = state.context?.documento.selfie_habilitada ?? false;

  // Handler para avançar do ConfirmDetailsStep
  const handleConfirmDetailsNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Handler para captura de selfie
  const handleSelfieCapture = useCallback(
    (base64: string) => {
      captureSelfie(base64);
    },
    [captureSelfie]
  );

  // Função auxiliar para converter AssinaturaMetrics para SignatureMetrics
  const convertMetrics = useCallback(
    (
      metrics?: SignatureMetrics | AssinaturaMetrics | null
    ): SignatureMetrics | undefined => {
      if (!metrics) return undefined;
      if ("pointCount" in metrics) return metrics;
      return {
        pointCount: metrics.pontos ?? 0,
        strokeCount: metrics.tracos ?? 0,
        totalLength: 0,
        boundingBox: {
          minX: 0,
          minY: 0,
          maxX: metrics.largura ?? 0,
          maxY: metrics.altura ?? 0,
          width: metrics.largura ?? 0,
          height: metrics.altura ?? 0,
        },
        duration: metrics.tempoDesenho,
      };
    },
    []
  );

  // Label dinâmica para o botão "next" do ReviewDocumentStep
  const reviewNextLabel = useMemo(() => {
    if (selfieHabilitada) {
      return "Continuar para Selfie";
    }
    return "Continuar para Assinatura";
  }, [selfieHabilitada]);

  // =====================================================================
  // RENDERIZAÇÃO CONDICIONAL
  // =====================================================================

  if (state.isLoading && !state.context) {
    return (
      <PublicPageShell>
        <LoadingState />
      </PublicPageShell>
    );
  }

  if (state.error && !state.context) {
    return (
      <PublicPageShell>
        <ErrorState error={state.error} onRetry={reloadContext} />
      </PublicPageShell>
    );
  }

  if (!state.context) {
    return (
      <PublicPageShell>
        <ErrorState
          error="Não foi possível carregar o documento."
          onRetry={reloadContext}
        />
      </PublicPageShell>
    );
  }

  if (!isDocumentReady) {
    return (
      <PublicPageShell>
        <DocumentNotReadyState />
      </PublicPageShell>
    );
  }

  // Assinante já concluiu
  if (isSignerCompleted) {
    return (
      <PublicPageShell>
        <SuccessStep
          documento={{
            titulo: state.context.documento.titulo,
            pdf_final_url: state.context.documento.pdf_final_url,
          }}
          onReturnToDashboard={() => {
            window.location.href = "/";
          }}
        />
      </PublicPageShell>
    );
  }

  // =====================================================================
  // RENDERIZAÇÃO DOS STEPS
  // =====================================================================

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "welcome":
        return (
          <WelcomeStep
            documento={{
              titulo: state.context!.documento.titulo,
              pdf_original_url: state.context!.documento.pdf_original_url,
            }}
            selfieHabilitada={selfieHabilitada}
            onNext={nextStep}
          />
        );

      case "confirm":
        return (
          <ConfirmDetailsStep
            token={token}
            dadosSnapshot={{
              nome_completo: String(
                state.context!.assinante.dados_snapshot.nome_completo ?? ""
              ),
              cpf: String(state.context!.assinante.dados_snapshot.cpf ?? ""),
              email: String(state.context!.assinante.dados_snapshot.email ?? ""),
              telefone: String(
                state.context!.assinante.dados_snapshot.telefone ?? ""
              ),
            }}
            currentStep={displayStepNumber}
            totalSteps={totalSteps}
            onPrevious={previousStep}
            onNext={handleConfirmDetailsNext}
          />
        );

      case "review":
        return (
          <ReviewDocumentStep
            pdfUrl={state.context!.documento.pdf_original_url}
            documentTitle={state.context!.documento.titulo}
            currentStep={displayStepNumber}
            totalSteps={totalSteps}
            onPrevious={previousStep}
            onNext={nextStep}
            nextLabel={reviewNextLabel}
          />
        );

      case "selfie":
        return (
          <SelfieStep
            selfieHabilitada={state.context!.documento.selfie_habilitada}
            currentStep={displayStepNumber}
            totalSteps={totalSteps}
            onPrevious={previousStep}
            onNext={nextStep}
            onPhotoCapture={handleSelfieCapture}
          />
        );

      case "signature":
        return (
          <SignatureStep
            token={token}
            rubricaNecessaria={hasRubrica}
            selfieBase64={state.selfieBase64 ?? undefined}
            currentStep={displayStepNumber}
            totalSteps={totalSteps}
            onPrevious={previousStep}
            onCapture={(data) => {
              const assinaturaMetrics = convertMetrics(data.metrics);
              if (!assinaturaMetrics) return;

              const rubricaMetrics = data.rubricaMetrics
                ? convertMetrics(data.rubricaMetrics)
                : undefined;

              captureSignature(
                data.assinatura,
                assinaturaMetrics,
                data.rubrica,
                rubricaMetrics
              );
            }}
            onTermosChange={setTermosAceite}
            onSuccess={async (data) => {
              const assinaturaMetrics = convertMetrics(data.metrics);
              if (!assinaturaMetrics) {
                throw new Error("Erro ao converter métricas da assinatura");
              }

              const rubricaMetrics = data.rubricaMetrics
                ? convertMetrics(data.rubricaMetrics)
                : undefined;

              await finalizeSigning({
                assinatura: data.assinatura,
                metrics: assinaturaMetrics,
                rubrica: data.rubrica,
                rubricaMetrics,
              });
            }}
          />
        );

      default:
        return (
          <ErrorState
            error="Step não encontrado."
            onRetry={() => window.location.reload()}
          />
        );
    }
  };

  return (
    <PublicPageShell>
      <div
        ref={contentRef}
        tabIndex={-1}
        className="h-full outline-none animate-in fade-in duration-200"
        key={currentStepId}
        aria-live="polite"
      >
        {renderCurrentStep()}
      </div>
    </PublicPageShell>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL (com Provider)
// =============================================================================

export function PublicSignatureFlow({ token }: PublicSignatureFlowProps) {
  if (!token) {
    return (
      <div className="flex items-center justify-center h-dvh p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <Heading level="section" className="text-lg text-foreground">
              Token inválido
            </Heading>
            <p className="text-sm text-muted-foreground">
              O link de assinatura é inválido ou expirado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicSignatureProvider token={token}>
      <PublicSignatureFlowContent token={token} />
    </PublicSignatureProvider>
  );
}

export default PublicSignatureFlow;
