"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";
import type { DeviceFingerprintData } from '@/shared/assinatura-digital/types';
import { collectDeviceFingerprint } from '@/shared/assinatura-digital/utils/device-fingerprint';

// =============================================================================
// TIPOS DO CONTEXTO PÚBLICO
// =============================================================================

/**
 * Estrutura do contexto retornado pela API pública GET /api/assinatura-digital/public/[token]
 */
export interface PublicContext {
  documento: {
    documento_uuid: string;
    titulo?: string | null;
    status: "rascunho" | "pronto" | "concluido" | "cancelado";
    selfie_habilitada: boolean;
    pdf_original_url: string;
    pdf_final_url?: string | null;
  };
  assinante: {
    id: number;
    status: "pendente" | "concluido";
    dados_snapshot: {
      nome_completo?: string;
      cpf?: string;
      email?: string;
      telefone?: string;
      [key: string]: unknown;
    };
    dados_confirmados: boolean;
  };
  anchors: Array<{ tipo: "assinatura" | "rubrica" }>;
}

/**
 * Métricas de assinatura capturadas do canvas
 */
export interface SignatureMetrics {
  pointCount: number;
  strokeCount: number;
  totalLength: number;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  averagePressure?: number;
  duration?: number;
}

/**
 * Dados de identificação do assinante
 */
export interface IdentificationData {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
}

/**
 * Dados de geolocalização
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// =============================================================================
// ESTADO DO FLUXO
// =============================================================================

export interface PublicSignatureState {
  // Contexto do documento (carregado da API)
  context: PublicContext | null;

  // Navegação
  currentStep: number;

  // Dados coletados durante o fluxo
  identification: IdentificationData | null;
  selfieBase64: string | null;
  assinaturaBase64: string | null;
  rubricaBase64: string | null;
  assinaturaMetrics: SignatureMetrics | null;
  rubricaMetrics: SignatureMetrics | null;
  deviceFingerprint: DeviceFingerprintData | null;
  geolocation: GeolocationData | null;
  termosAceite: boolean;

  // Estados de UI
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: PublicSignatureState = {
  context: null,
  currentStep: 0,
  identification: null,
  selfieBase64: null,
  assinaturaBase64: null,
  rubricaBase64: null,
  assinaturaMetrics: null,
  rubricaMetrics: null,
  deviceFingerprint: null,
  geolocation: null,
  termosAceite: false,
  isLoading: true,
  isSubmitting: false,
  error: null,
};

// =============================================================================
// AÇÕES DO REDUCER
// =============================================================================

type PublicSignatureAction =
  | { type: "LOAD_CONTEXT_START" }
  | { type: "LOAD_CONTEXT_SUCCESS"; payload: PublicContext }
  | { type: "LOAD_CONTEXT_ERROR"; payload: string }
  | { type: "SAVE_IDENTIFICATION_START" }
  | { type: "SAVE_IDENTIFICATION_SUCCESS"; payload: IdentificationData }
  | { type: "SAVE_IDENTIFICATION_ERROR"; payload: string }
  | { type: "CAPTURE_SELFIE"; payload: string }
  | {
      type: "CAPTURE_SIGNATURE";
      payload: {
        assinatura: string;
        metrics: SignatureMetrics;
        rubrica?: string;
        rubricaMetrics?: SignatureMetrics;
      };
    }
  | { type: "SET_DEVICE_FINGERPRINT"; payload: DeviceFingerprintData }
  | { type: "SET_GEOLOCATION"; payload: GeolocationData }
  | { type: "SET_TERMOS_ACEITE"; payload: boolean }
  | { type: "FINALIZE_START" }
  | { type: "FINALIZE_SUCCESS" }
  | { type: "FINALIZE_ERROR"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

function publicSignatureReducer(
  state: PublicSignatureState,
  action: PublicSignatureAction
): PublicSignatureState {
  switch (action.type) {
    case "LOAD_CONTEXT_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOAD_CONTEXT_SUCCESS":
      return {
        ...state,
        isLoading: false,
        context: action.payload,
        error: null,
      };

    case "LOAD_CONTEXT_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "SAVE_IDENTIFICATION_START":
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };

    case "SAVE_IDENTIFICATION_SUCCESS":
      return {
        ...state,
        isSubmitting: false,
        identification: action.payload,
        error: null,
      };

    case "SAVE_IDENTIFICATION_ERROR":
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    case "CAPTURE_SELFIE":
      return {
        ...state,
        selfieBase64: action.payload,
      };

    case "CAPTURE_SIGNATURE":
      return {
        ...state,
        assinaturaBase64: action.payload.assinatura,
        assinaturaMetrics: action.payload.metrics,
        rubricaBase64: action.payload.rubrica ?? null,
        rubricaMetrics: action.payload.rubricaMetrics ?? null,
      };

    case "SET_DEVICE_FINGERPRINT":
      return {
        ...state,
        deviceFingerprint: action.payload,
      };

    case "SET_GEOLOCATION":
      return {
        ...state,
        geolocation: action.payload,
      };

    case "SET_TERMOS_ACEITE":
      return {
        ...state,
        termosAceite: action.payload,
      };

    case "FINALIZE_START":
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };

    case "FINALIZE_SUCCESS":
      return {
        ...state,
        isSubmitting: false,
        error: null,
      };

    case "FINALIZE_ERROR":
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    case "NEXT_STEP":
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };

    case "PREVIOUS_STEP":
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };

    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// CONTEXTO
// =============================================================================

/**
 * Dados opcionais que podem ser passados diretamente para finalizeSigning
 * para evitar condições de corrida com o state do reducer
 */
export interface FinalizeSigningData {
  assinatura: string;
  metrics: SignatureMetrics;
  rubrica?: string;
  rubricaMetrics?: SignatureMetrics;
}

export interface PublicSignatureContextValue {
  state: PublicSignatureState;
  loadContext: (token: string) => Promise<void>;
  reloadContext: () => Promise<void>;
  saveIdentification: (data: IdentificationData) => Promise<void>;
  captureSelfie: (base64: string) => void;
  captureSignature: (
    assinatura: string,
    metrics: SignatureMetrics,
    rubrica?: string,
    rubricaMetrics?: SignatureMetrics
  ) => void;
  setDeviceFingerprint: (fingerprint: DeviceFingerprintData) => void;
  setGeolocation: (latitude: number, longitude: number, accuracy: number) => void;
  setTermosAceite: (value: boolean) => void;
  finalizeSigning: (data?: FinalizeSigningData) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;

  // Propriedades derivadas úteis
  hasRubrica: boolean;
  totalSteps: number;
  isDocumentReady: boolean;
  isSignerCompleted: boolean;
}

const PublicSignatureContext = createContext<PublicSignatureContextValue | null>(
  null
);

// =============================================================================
// PROVIDER
// =============================================================================

interface PublicSignatureProviderProps {
  children: React.ReactNode;
  token: string;
}

export function PublicSignatureProvider({
  children,
  token,
}: PublicSignatureProviderProps) {
  const [state, dispatch] = useReducer(publicSignatureReducer, initialState);

  // Carrega contexto da API
  const loadContext = useCallback(async (loadToken: string) => {
    dispatch({ type: "LOAD_CONTEXT_START" });

    try {
      const response = await fetch(
        `/api/assinatura-digital/public/${loadToken}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Link inválido ou expirado.");
      }

      dispatch({
        type: "LOAD_CONTEXT_SUCCESS",
        payload: result.data as PublicContext,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar documento.";
      dispatch({ type: "LOAD_CONTEXT_ERROR", payload: message });
      toast.error(message);
    }
  }, []);

  // Recarrega contexto com o token atual
  const reloadContext = useCallback(async () => {
    await loadContext(token);
  }, [loadContext, token]);

  // Salva dados de identificação
  const saveIdentification = useCallback(
    async (data: IdentificationData) => {
      dispatch({ type: "SAVE_IDENTIFICATION_START" });

      try {
        const response = await fetch(
          `/api/assinatura-digital/public/${token}/identificacao`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome_completo: data.nome_completo.trim(),
              cpf: data.cpf.replace(/\D/g, ""),
              email: data.email.trim(),
              telefone: data.telefone.replace(/\D/g, ""),
            }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar dados.");
        }

        dispatch({ type: "SAVE_IDENTIFICATION_SUCCESS", payload: data });

        // Recarrega contexto para atualizar dados_confirmados
        await reloadContext();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao salvar dados.";
        dispatch({ type: "SAVE_IDENTIFICATION_ERROR", payload: message });
        toast.error(message);
        throw error;
      }
    },
    [token, reloadContext]
  );

  // Captura selfie
  const captureSelfie = useCallback((base64: string) => {
    dispatch({ type: "CAPTURE_SELFIE", payload: base64 });
  }, []);

  // Captura assinatura e rubrica
  const captureSignature = useCallback(
    (
      assinatura: string,
      metrics: SignatureMetrics,
      rubrica?: string,
      rubricaMetrics?: SignatureMetrics
    ) => {
      dispatch({
        type: "CAPTURE_SIGNATURE",
        payload: { assinatura, metrics, rubrica, rubricaMetrics },
      });
    },
    []
  );

  // Define fingerprint do dispositivo
  const setDeviceFingerprint = useCallback(
    (fingerprint: DeviceFingerprintData) => {
      dispatch({ type: "SET_DEVICE_FINGERPRINT", payload: fingerprint });
    },
    []
  );

  // Define geolocalização
  const setGeolocation = useCallback(
    (latitude: number, longitude: number, accuracy: number) => {
      dispatch({
        type: "SET_GEOLOCATION",
        payload: { latitude, longitude, accuracy },
      });
    },
    []
  );

  const setTermosAceite = useCallback((value: boolean) => {
    dispatch({ type: "SET_TERMOS_ACEITE", payload: value });
  }, []);

  // Finaliza a assinatura
  // Aceita dados opcionais para evitar condição de corrida com o state do reducer
  const finalizeSigning = useCallback(async (data?: FinalizeSigningData) => {
    if (!state.termosAceite) {
      toast.error("Você deve aceitar os termos para continuar.");
      return;
    }

    // Usar dados passados diretamente ou fallback para o state
    const assinaturaBase64 = data?.assinatura ?? state.assinaturaBase64;
    const assinaturaMetrics = data?.metrics ?? state.assinaturaMetrics;
    const rubricaBase64 = data?.rubrica ?? state.rubricaBase64;
    const rubricaMetrics = data?.rubricaMetrics ?? state.rubricaMetrics;

    if (!assinaturaBase64) {
      toast.error("Assinatura obrigatória.");
      return;
    }

    dispatch({ type: "FINALIZE_START" });

    try {
      const response = await fetch(
        `/api/assinatura-digital/public/${token}/finalizar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selfie_base64: state.selfieBase64,
            assinatura_base64: assinaturaBase64,
            assinatura_metrics: assinaturaMetrics,
            rubrica_base64: rubricaBase64,
            rubrica_metrics: rubricaMetrics,
            geolocation: state.geolocation,
            termos_aceite: true,
            termos_aceite_versao: "v1.0-MP2200-2",
            dispositivo_fingerprint_raw: state.deviceFingerprint,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao finalizar assinatura.");
      }

      dispatch({ type: "FINALIZE_SUCCESS" });
      dispatch({ type: "NEXT_STEP" });
      toast.success("Assinatura concluída com sucesso!");

      // Opcional: recarrega contexto para refletir status concluído
      await reloadContext();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao finalizar assinatura.";
      dispatch({ type: "FINALIZE_ERROR", payload: message });
      toast.error(message);
    }
  }, [
    token,
    state.selfieBase64,
    state.assinaturaBase64,
    state.assinaturaMetrics,
    state.rubricaBase64,
    state.rubricaMetrics,
    state.geolocation,
    state.termosAceite,
    state.deviceFingerprint,
    reloadContext,
  ]);

  // Navegação
  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: "PREVIOUS_STEP" });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  // Gerenciamento de erros
  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Carrega contexto e device fingerprint ao montar
  useEffect(() => {
    void loadContext(token);
    void collectDeviceFingerprint().then(setDeviceFingerprint);
  }, [loadContext, token, setDeviceFingerprint]);

  // Propriedades derivadas
  const hasRubrica = useMemo(
    () => (state.context?.anchors ?? []).some((a) => a.tipo === "rubrica"),
    [state.context?.anchors]
  );

  const totalSteps = useMemo(() => {
    if (!state.context) return 4;
    // Welcome, Confirm, Review, [Selfie], Signature, Success
    // Success não conta como step de navegação
    const baseSteps = 4; // Welcome, Confirm, Review, Signature
    return state.context.documento.selfie_habilitada ? baseSteps + 1 : baseSteps;
  }, [state.context]);

  const isDocumentReady = useMemo(() => {
    const status = state.context?.documento.status;
    return status === "pronto" || status === "concluido";
  }, [state.context?.documento.status]);

  const isSignerCompleted = useMemo(
    () => state.context?.assinante.status === "concluido",
    [state.context?.assinante.status]
  );

  const value = useMemo<PublicSignatureContextValue>(
    () => ({
      state,
      loadContext,
      reloadContext,
      saveIdentification,
      captureSelfie,
      captureSignature,
      setDeviceFingerprint,
      setGeolocation,
      finalizeSigning,
      nextStep,
      previousStep,
      goToStep,
      setError,
      clearError,
      reset,
      hasRubrica,
      totalSteps,
      isDocumentReady,
      isSignerCompleted,
      setTermosAceite,
    }),
    [
      state,
      loadContext,
      reloadContext,
      saveIdentification,
      captureSelfie,
      captureSignature,
      setDeviceFingerprint,
      setGeolocation,
      finalizeSigning,
      nextStep,
      previousStep,
      goToStep,
      setError,
      clearError,
      reset,
      hasRubrica,
      totalSteps,
      isDocumentReady,
      isSignerCompleted,
      setTermosAceite,
    ]
  );

  return (
    <PublicSignatureContext.Provider value={value}>
      {children}
    </PublicSignatureContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function usePublicSignature(): PublicSignatureContextValue {
  const context = useContext(PublicSignatureContext);

  if (!context) {
    throw new Error(
      "usePublicSignature must be used within a PublicSignatureProvider"
    );
  }

  return context;
}

// =============================================================================
// EXPORTS ADICIONAIS
// =============================================================================

export { PublicSignatureContext };
