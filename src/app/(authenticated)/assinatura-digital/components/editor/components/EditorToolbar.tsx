'use client';

import type React from 'react';
import ToolbarButtons from '../ToolbarButtons';
import type { EditorMode } from '../types';
import styles from '../FieldMappingEditor.module.css';

interface EditorToolbarProps {
  // Position & drag state
  toolbarPosition: { x: number; y: number };
  onMouseDown: (event: React.MouseEvent) => void;
  onTouchStart: (event: React.TouchEvent) => void;

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
 * EditorToolbar - Floating, draggable toolbar wrapper for ToolbarButtons
 * Handles desktop toolbar with drag-to-reposition functionality
 */
export default function EditorToolbar({
  toolbarPosition,
  onMouseDown,
  onTouchStart,
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
}: EditorToolbarProps) {
  return (
    <div
      className={styles.floatingToolbar}
      style={
        {
          '--toolbar-x': `${toolbarPosition.x}px`,
          '--toolbar-y': `${toolbarPosition.y}px`,
        } as React.CSSProperties
      }
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <ToolbarButtons
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
