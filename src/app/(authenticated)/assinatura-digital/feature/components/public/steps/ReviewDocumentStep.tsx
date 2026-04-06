"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Minus, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import PdfPreviewDynamic from "../../pdf/PdfPreviewDynamic";
import { useCSPNonce } from "@/hooks/use-csp-nonce";

export interface ReviewDocumentStepProps {
  pdfUrl: string;
  documentTitle?: string | null;
  currentStep?: number;
  totalSteps?: number;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export function ReviewDocumentStep({
  pdfUrl,
  documentTitle,
  currentStep = 2,
  totalSteps = 3,
  onPrevious,
  onNext,
  nextLabel = "Continuar para Selfie",
}: ReviewDocumentStepProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const nonce = useCSPNonce();

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleLoadSuccess = useCallback((pages: number) => {
    setNumPages(pages);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <PublicStepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Revisar Documento"
      description="Leia o documento com atenção antes de prosseguir."
      onPrevious={onPrevious}
      onNext={onNext}
      nextLabel={nextLabel}
      previousLabel="Voltar"
    >
      <div className="flex flex-col h-full gap-2">
        {/* PDF Viewer - Takes all available space */}
        <div className="relative flex-1 min-h-0">
          {/* Floating Toolbar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-2 py-1 mt-2">
            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-9 w-9 rounded-full"
              aria-label="Diminuir zoom"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-xs font-medium w-10 text-center text-muted-foreground">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-9 w-9 rounded-full"
              aria-label="Aumentar zoom"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>

            {/* Separator */}
            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 rounded-full"
              aria-label="Baixar documento"
            >
              <a href={pdfUrl} download={documentTitle || "documento.pdf"} title="Baixar documento">
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>

          {/* PDF Scrollable Area - minimal padding to maximize reading area */}
          <div className="h-full overflow-y-auto pdf-scrollbar bg-muted/30 rounded-lg px-1 pt-12 pb-2 sm:px-2 sm:pt-12 flex flex-col items-center gap-4">
            <PdfPreviewDynamic
              pdfUrl={pdfUrl}
              zoom={zoom / 100}
              showControls={false}
              showPageIndicator={false}
              onLoadSuccess={handleLoadSuccess}
              onPageChange={handlePageChange}
              className="w-full [&_.react-pdf__Page]:shadow-md [&_.react-pdf__Page]:rounded-sm [&_.react-pdf__Page]:bg-white"
            />
          </div>

          {/* Page Indicator - Bottom floating pill */}
          {numPages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground/80 backdrop-blur-sm text-background px-3 py-1 rounded-full text-xs font-medium shadow-lg pointer-events-none z-20">
              {currentPage} / {numPages}
            </div>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style nonce={nonce} dangerouslySetInnerHTML={{__html: `
        .pdf-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .pdf-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .pdf-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .pdf-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `}} />
    </PublicStepLayout>
  );
}
