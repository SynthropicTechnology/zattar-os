'use client';

import type React from 'react';
import type { RefObject } from 'react';
import PdfCanvasArea from '../PdfCanvasArea';
import type { EditorField } from '../types';

interface CanvasSize {
  width: number;
  height: number;
}

interface EditorCanvasProps {
  canvasRef: RefObject<HTMLDivElement>;
  canvasSize: CanvasSize;
  zoom: number;
  pdfUrl: string | null;
  previewKey: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: Error) => void;
  fields: EditorField[];
  fieldsWithHeightWarning: Set<string>;
  onCanvasClick: (event: React.MouseEvent) => void;
  onFieldClick: (field: EditorField, event: React.MouseEvent) => void;
  onFieldMouseDown: (field: EditorField, event: React.MouseEvent) => void;
  onFieldKeyboard: (field: EditorField, event: React.KeyboardEvent<HTMLDivElement>) => void;
  onResizeMouseDown: (
    field: EditorField,
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
    event: React.MouseEvent
  ) => void;
  selectedField: EditorField | null;
  onOpenProperties: () => void;
  onDuplicateField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onAddTextField: () => void;
  onAddImageField: () => void;
  onAddRichTextField: () => void;
  onEditRichText: (fieldId: string) => void;
  onAdjustHeight: (fieldId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  // Drag & drop from palette
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  // Signer information for field visualization
  getSignerColor?: (signerId: string | undefined) => string;
  getSignerById?: (id: string) => { id: string; nome: string; cor: string } | undefined;
  // Signer reassignment
  signers?: Array<{ id: string; nome: string; cor: string }>;
  onReassignField?: (fieldId: string, signerId: string) => void;
}

/**
 * EditorCanvas - Wrapper component for the PDF canvas area
 * Passes all necessary props to PdfCanvasArea for field editing
 */
export default function EditorCanvas({
  canvasRef,
  canvasSize,
  zoom,
  pdfUrl,
  previewKey,
  currentPage,
  totalPages,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  fields,
  fieldsWithHeightWarning,
  onCanvasClick,
  onFieldClick,
  onFieldMouseDown,
  onFieldKeyboard,
  onResizeMouseDown,
  selectedField,
  onOpenProperties,
  onDuplicateField,
  onDeleteField,
  onAddTextField,
  onAddImageField,
  onAddRichTextField,
  onEditRichText,
  onAdjustHeight,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDragOver,
  onDrop,
  getSignerColor,
  getSignerById,
  signers,
  onReassignField,
}: EditorCanvasProps) {
  return (
    <PdfCanvasArea
      canvasRef={canvasRef}
      canvasSize={canvasSize}
      zoom={zoom}
      pdfUrl={pdfUrl}
      previewKey={previewKey}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      fields={fields}
      fieldsWithHeightWarning={fieldsWithHeightWarning}
      onCanvasClick={onCanvasClick}
      onFieldClick={onFieldClick}
      onFieldMouseDown={onFieldMouseDown}
      onFieldKeyboard={onFieldKeyboard}
      onResizeMouseDown={onResizeMouseDown}
      selectedField={selectedField}
      onOpenProperties={onOpenProperties}
      onDuplicateField={onDuplicateField}
      onDeleteField={onDeleteField}
      onAddTextField={onAddTextField}
      onAddImageField={onAddImageField}
      onAddRichTextField={onAddRichTextField}
      onEditRichText={onEditRichText}
      onAdjustHeight={onAdjustHeight}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onResetZoom={onResetZoom}
      onDragOver={onDragOver}
      onDrop={onDrop}
      getSignerColor={getSignerColor}
      getSignerById={getSignerById}
      signers={signers}
      onReassignField={onReassignField}
    />
  );
}
