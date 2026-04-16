"use client";

import { useState, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
        // Persist immediately to store
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
    <div className="space-y-4">
      {!capturedPhoto && (
        <>
          {/* Webcam Error Alert */}
          {webcamError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{webcamError}</AlertDescription>
            </Alert>
          )}

          {/* Webcam Mode */}
          {!webcamError && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-input bg-muted">
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
                {!isWebcamReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Carregando câmera...</p>
                  </div>
                )}
              </div>
              <Button onClick={handleCapturePhoto} disabled={!isWebcamReady} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Capturar Foto
              </Button>
            </div>
          )}
        </>
      )}

      {/* Photo Preview */}
      {capturedPhoto && (
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-input">
            <img src={capturedPhoto} alt="Foto capturada" className="w-full h-full object-cover" />
          </div>
          <Button variant="outline" onClick={handleRetakePhoto} className="w-full">
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