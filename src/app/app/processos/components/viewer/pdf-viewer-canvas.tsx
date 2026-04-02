'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfPreview = dynamic(
  () => import('@/app/app/assinatura-digital/feature/components/pdf/PdfPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface PdfViewerCanvasProps {
  pdfUrl: string;
  currentPage: number;
  zoomLevel: number;
  pageWidth?: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (numPages: number) => void;
}

export function PdfViewerCanvas({
  pdfUrl,
  currentPage,
  zoomLevel,
  pageWidth,
  onPageChange,
  onLoadSuccess,
}: PdfViewerCanvasProps) {
  return (
    <PdfPreview
      pdfUrl={pdfUrl}
      mode="background"
      initialPage={currentPage}
      zoom={zoomLevel / 100}
      pageWidth={pageWidth}
      renderTextLayer={true}
      renderAnnotationLayer={true}
      onPageChange={onPageChange}
      onLoadSuccess={onLoadSuccess}
      className="w-full [&_.react-pdf__Document]:flex [&_.react-pdf__Document]:justify-center [&_.react-pdf__Page]:shadow-xl [&_.react-pdf__Page]:rounded-sm [&_.react-pdf__Page]:bg-white"
    />
  );
}