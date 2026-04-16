'use client';

import ToolbarButtonsMobile from '../ToolbarButtonsMobile';
import type { EditorMode } from '../types';

interface EditorToolbarMobileProps {
  // Editor mode
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onAddRichTextField?: () => void;

  // Zoom controls
  zoomPercentage: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canResetZoom: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;

  // Page navigation
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPreviousPage: () => void;

  // Properties
  hasSelectedField: boolean;
  onOpenProperties: () => void;

  // Template info & PDF replacement
  onOpenTemplateInfo: () => void;
  onReplacePdf: () => void;

  // Actions
  onCancel: () => void;
  onSave: () => void;
  onGenerateTestPreview?: () => void;
  isGeneratingPreview?: boolean;
  pdfUrl?: string | null;
  isCreateMode?: boolean;
  hasTemplateId?: boolean;

  // Preview toggle
  showFilledPreview?: boolean;
  onTogglePreview?: () => void;
  hasPreviewPdf?: boolean;
}

/**
 * EditorToolbarMobile - Horizontal toolbar for mobile devices
 * Styled with background and border for visual consistency
 */
export default function EditorToolbarMobile({
  editorMode,
  onModeChange,
  onAddRichTextField,
  zoomPercentage,
  canZoomIn,
  canZoomOut,
  canResetZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentPage,
  totalPages,
  onNextPage,
  onPreviousPage,
  hasSelectedField,
  onOpenProperties,
  onOpenTemplateInfo,
  onReplacePdf,
  onCancel,
  onSave,
  onGenerateTestPreview,
  isGeneratingPreview = false,
  pdfUrl = null,
  isCreateMode = false,
  hasTemplateId = true,
  showFilledPreview = false,
  onTogglePreview,
  hasPreviewPdf = false,
}: EditorToolbarMobileProps) {
  return (
    <div className="shrink-0 border-b bg-card px-3 py-1.5 lg:hidden">
      <ToolbarButtonsMobile
        editorMode={editorMode}
        onModeChange={onModeChange}
        onAddRichTextField={onAddRichTextField}
        zoomPercentage={zoomPercentage}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        canResetZoom={canResetZoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        hasSelectedField={hasSelectedField}
        onOpenProperties={onOpenProperties}
        onOpenTemplateInfo={onOpenTemplateInfo}
        onReplacePdf={onReplacePdf}
        onCancel={onCancel}
        onSave={onSave}
        onGenerateTestPreview={onGenerateTestPreview}
        isGeneratingPreview={isGeneratingPreview}
        pdfUrl={pdfUrl}
        isCreateMode={isCreateMode}
        hasTemplateId={hasTemplateId}
        showFilledPreview={showFilledPreview}
        onTogglePreview={onTogglePreview}
        hasPreviewPdf={hasPreviewPdf}
      />
    </div>
  );
}
