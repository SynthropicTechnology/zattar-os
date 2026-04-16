"use client";
import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssinaturaMetrics } from "../../utils";

export interface CanvasAssinaturaRef {
  getSignatureBase64: () => string;
  isEmpty: () => boolean;
  clear: () => void;
  getMetrics: () => AssinaturaMetrics;
}

interface CanvasAssinaturaProps {
  /** Hide the internal clear button when the parent provides its own */
  hideClearButton?: boolean;
  /** Callback fired when a stroke ends (useful for updating empty state) */
  onStrokeEnd?: () => void;
}

const CanvasAssinatura = forwardRef<CanvasAssinaturaRef, CanvasAssinaturaProps>(
  ({ hideClearButton = false, onStrokeEnd }, ref) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(250);
  const [drawingStartTime, setDrawingStartTime] = useState<number | null>(null);
  const [totalDrawingTime, setTotalDrawingTime] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) {
        return;
      }

      const width = containerRef.current.offsetWidth;
      const computedWidth = Math.min(width, 600);
      const computedHeight = window.innerWidth < 768 ? 150 : 200;

      setCanvasWidth(computedWidth);
      setCanvasHeight(computedHeight);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const resetMetrics = () => {
    setDrawingStartTime(null);
    setTotalDrawingTime(0);
    setStrokeCount(0);
    setPointCount(0);
  };

  const updatePointMetrics = () => {
    const data = signatureRef.current?.toData?.() ?? [];
    const totalPoints = data.reduce((acc: number, stroke: Array<{ x: number; y: number }>) => {
      return acc + stroke.length;
    }, 0);
    setPointCount(totalPoints);
  };

  const handleBeginStroke = () => {
    if (drawingStartTime === null) {
      setDrawingStartTime(Date.now());
    }
    setStrokeCount((prev) => prev + 1);
  };

  const handleEndStroke = () => {
    if (drawingStartTime !== null) {
      setTotalDrawingTime((prev) => prev + (Date.now() - drawingStartTime));
      setDrawingStartTime(null);
    }
    updatePointMetrics();
    onStrokeEnd?.();
  };

  const getBoundingBox = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let pixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          pixelCount++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (pixelCount === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    setPointCount(pixelCount);
    return { minX, maxX, minY, maxY };
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    resetMetrics();
  };

  useImperativeHandle(ref, () => ({
    getSignatureBase64: () => {
      if (signatureRef.current?.isEmpty()) {
        return "";
      }
      return signatureRef.current?.toDataURL("image/png") || "";
    },
    isEmpty: () => {
      return signatureRef.current?.isEmpty() ?? true;
    },
    clear: () => {
      handleClear();
    },
    getMetrics: () => {
      const canvas = signatureRef.current?.getCanvas();
      if (!canvas) {
        return {
          pontos: pointCount,
          largura: 0,
          altura: 0,
          tempoDesenho: totalDrawingTime,
          tracos: strokeCount,
        };
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return {
          pontos: pointCount,
          largura: 0,
          altura: 0,
          tempoDesenho: totalDrawingTime,
          tracos: strokeCount,
        };
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { minX, maxX, minY, maxY } = getBoundingBox(imageData);

      return {
        pontos: pointCount,
        largura: Math.max(0, maxX - minX),
        altura: Math.max(0, maxY - minY),
        tempoDesenho: totalDrawingTime,
        tracos: strokeCount,
      };
    },
  }));

  return (
    <div ref={containerRef} className="space-y-3 w-full max-w-150 mx-auto">
      <div className="border border-input rounded-md bg-white overflow-hidden shadow-sm dark:shadow-none dark:border-border">
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            width: canvasWidth,
            height: canvasHeight,
            className: "w-full touch-none",
          }}
          backgroundColor="white"
          penColor="black"
          onBegin={handleBeginStroke}
          onEnd={handleEndStroke}
        />
      </div>
      {!hideClearButton && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
});

CanvasAssinatura.displayName = "CanvasAssinatura";

export default CanvasAssinatura;
