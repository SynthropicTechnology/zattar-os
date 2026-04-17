"use client";

import { useState, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Text } from "@/components/ui/typography";

export interface CapturaFotoRef {
  getPhotoBase64: () => string;
  hasPhoto: () => boolean;
}

interface CapturaFotoProps {
  initialPhoto?: string;
  onWebcamErrorChange?: (hasError: boolean) => void;
  onPhotoCaptured?: (base64: string) => void;
  onPhotoCleared?: () => void;
}

const CapturaFoto = forwardRef<CapturaFotoRef, CapturaFotoProps>(({ initialPhoto, onWebcamErrorChange, onPhotoCaptured, onPhotoCleared }, ref) => {
  const [overriddenPhoto, setOverriddenPhoto] = useState<string | null>(null);
  const capturedPhoto = overriddenPhoto ?? initialPhoto ?? "";
  const [webcamError, setWebcamError] = useState<string>("");
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  useImperativeHandle(ref, () => ({
    getPhotoBase64: () => {
      return capturedPhoto;
    },
    hasPhoto: () => {
      return capturedPhoto.length > 0;
    },
  }));

  const handleCapturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Validar tamanho da imagem capturada
        const base64Data = imageSrc.includes(",") ? imageSrc.split(",")[1] : imageSrc;
        const sizeInBytes = (base64Data.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInMB > 5) {
          toast.error("A imagem capturada excede 5MB. Reduza a resolução ou tente novamente.");
          return;
        }

        setOverriddenPhoto(imageSrc);
        onPhotoCaptured?.(imageSrc);
      }
    }
  }, [onPhotoCaptured]);

  const handleRetakePhoto = () => {
    setOverriddenPhoto("");
    onPhotoCleared?.();
  };

  const handleWebcamError = (error: string | DOMException) => {
    console.error("Webcam error:", error);
    setWebcamError("Não foi possível acessar a câmera. Por favor, permita o acesso à câmera para continuar.");
    onWebcamErrorChange?.(true);
  };

  const handleWebcamReady = () => {
    setIsWebcamReady(true);
    setWebcamError("");
    onWebcamErrorChange?.(false);
  };

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      {!capturedPhoto && (
        <>
          {/* Webcam error — glass destructive */}
          {webcamError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 backdrop-blur-sm"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                strokeWidth={2.25}
              />
              <Text variant="caption" className="text-destructive leading-relaxed">
                {webcamError}
              </Text>
            </div>
          )}

          {/* Webcam viewport */}
          {!webcamError && (
            <div className="space-y-4">
              <GlassPanel
                depth={2}
                className="relative aspect-square w-full overflow-hidden rounded-2xl p-0"
              >
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.8}
                  videoConstraints={{
                    width: 500,
                    height: 500,
                    facingMode: "user",
                  }}
                  onUserMedia={handleWebcamReady}
                  onUserMediaError={handleWebcamError}
                  className="w-full h-full object-cover"
                />

                {/* Moldura oval tracejada pra guiar enquadramento */}
                {isWebcamReady && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <div className="h-[70%] w-[60%] rounded-[50%] border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_color-mix(in_oklch,black_25%,transparent)]" />
                  </div>
                )}

                {/* Loading overlay */}
                {!isWebcamReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/80 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <Text variant="caption" className="text-muted-foreground">
                      Carregando câmera...
                    </Text>
                  </div>
                )}
              </GlassPanel>

              <Button
                onClick={handleCapturePhoto}
                disabled={!isWebcamReady}
                className="h-12 w-full cursor-pointer active:scale-[0.98] transition-colors"
              >
                <Camera className="mr-2 h-4 w-4" />
                Capturar Foto
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview da foto */}
      {capturedPhoto && (
        <div className="space-y-4">
          <GlassPanel
            depth={2}
            className="relative aspect-square w-full overflow-hidden rounded-2xl p-0"
          >
            <img
              src={capturedPhoto}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
          </GlassPanel>
          <Button
            variant="outline"
            onClick={handleRetakePhoto}
            className="h-12 w-full cursor-pointer border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-sm hover:bg-surface-container-lowest hover:border-outline-variant active:scale-[0.98]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Trocar Foto
          </Button>
        </div>
      )}
    </div>
  );
});

CapturaFoto.displayName = "CapturaFoto";

export default CapturaFoto;
