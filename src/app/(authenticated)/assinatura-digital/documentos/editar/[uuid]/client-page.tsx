"use client";

/**
 * EditarDocumentoClient — Etapa 2: Configurar assinantes e posicionar campos.
 *
 * Layout: PDF canvas (bg-ambient glass) à esquerda + FloatingSidebar glass à direita.
 * Alinhado ao Design System Glass Briefing (POC novo-documento):
 * - Canvas com backdrop ambiente (radial glow sutil em vez de bg-muted/30 chapado)
 * - Indicador de salvamento como pill glass-kpi com Loader2
 * - Sidebar com divisor vertical ambient (sem border-l duro)
 */

import { useDocumentEditor } from '@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-document-editor';
import { PDF_CANVAS_SIZE } from '@/shared/assinatura-digital/types/pdf-preview.types';
import EditorCanvas from '@/app/(authenticated)/assinatura-digital/components/editor/components/EditorCanvas';
import FloatingSidebar from '@/app/(authenticated)/assinatura-digital/components/editor/components/FloatingSidebar';
import { Loader2 } from "lucide-react";
import { DocumentFlowShell } from '@/app/(authenticated)/assinatura-digital/components/flow';

interface EditarDocumentoClientProps {
  uuid: string;
}

export function EditarDocumentoClient({ uuid }: EditarDocumentoClientProps) {
  const { state, actions, refs } = useDocumentEditor({ uuid });

  const {
    documento,
    isLoading,
    isSaving,
    pdfUrl,
    currentPage,
    totalPages,
    fields,
    selectedField,
    zoom,
    signers,
    activeSigner,
    dragState,
  } = state;

  const {
    setCurrentPage,
    setTotalPages,
    setFields,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    setActiveSigner,
    handleAddSigner,
    handleDeleteSigner,
    handleUpdateSigner,
    getSignerById,
    getSignerColor,
    handleFieldClick,
    handleCanvasClick,
    handleFieldMouseDown,
    handleResizeMouseDown,
    handleFieldKeyboard,
    duplicateField,
    deleteField,
    handleCanvasDragOver,
    handleCanvasDrop,
    handleUpdateSettings,
    handleSaveAndReview,
  } = actions;

  const { canvasRef } = refs;

  if (isLoading || !documento) {
    return (
      <DocumentFlowShell fullHeight>
        <div className="flex w-full h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            Carregando documento...
          </span>
        </div>
      </DocumentFlowShell>
    );
  }

  return (
    <DocumentFlowShell fullHeight>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* ── PDF Canvas Area ─────────────────────────── */}
        <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {/* Ambient radial gradient backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-linear-to-br from-primary/3 via-transparent to-info/3"
          />

          {/* Indicador de salvamento — pill glass */}
          {isSaving && (
            <div className="absolute top-4 right-6 z-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-kpi border border-info/25 bg-info/5 backdrop-blur-md text-xs font-medium text-info">
                <Loader2 className="size-3 animate-spin" />
                Salvando...
              </span>
            </div>
          )}

          {/* PDF Canvas — scrollable */}
          <div className="relative flex-1 overflow-auto p-6 scroll-smooth scrollbar-custom bg-muted/15">
            <div className="flex justify-center min-h-full pb-20">
              <EditorCanvas
                canvasRef={canvasRef}
                canvasSize={PDF_CANVAS_SIZE}
                zoom={zoom}
                pdfUrl={pdfUrl}
                previewKey={1}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onLoadSuccess={setTotalPages}
                onLoadError={(e: Error) =>
                  console.error("Error loading PDF", e)
                }
                fields={fields}
                fieldsWithHeightWarning={new Set()}
                onCanvasClick={handleCanvasClick}
                onFieldClick={(f, e) =>
                  handleFieldClick(f, e, dragState.isDragging)
                }
                onFieldMouseDown={handleFieldMouseDown}
                onFieldKeyboard={handleFieldKeyboard}
                onResizeMouseDown={handleResizeMouseDown}
                onDragOver={handleCanvasDragOver}
                onDrop={(e) => handleCanvasDrop(e, activeSigner)}
                selectedField={selectedField}
                onOpenProperties={() => {}}
                onDuplicateField={duplicateField}
                onDeleteField={deleteField}
                onAddTextField={() => {}}
                onAddImageField={() => {}}
                onAddRichTextField={() => {}}
                onEditRichText={() => {}}
                onAdjustHeight={() => {}}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                getSignerColor={getSignerColor}
                getSignerById={getSignerById}
                signers={signers}
                onReassignField={(fId, sId) => {
                  setFields((prev) =>
                    prev.map((f) =>
                      f.id === fId ? { ...f, signatario_id: sId } : f
                    )
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Right Sidebar (glass) ───────────────────── */}
        <div className="hidden h-full min-h-0 w-85 shrink-0 border-l border-border/30 lg:flex">
          <FloatingSidebar
            className="h-full flex flex-col"
            signers={signers}
            activeSigner={activeSigner}
            onSelectSigner={setActiveSigner}
            onAddSigner={handleAddSigner}
            onUpdateSigner={handleUpdateSigner}
            onDeleteSigner={handleDeleteSigner}
            fields={fields}
            onPaletteDragStart={() => {}}
            onPaletteDragEnd={() => {}}
            onReviewAndSend={handleSaveAndReview}
            documentTitle={documento.titulo ?? ""}
            selfieEnabled={documento.selfie_habilitada}
            onUpdateSettings={handleUpdateSettings}
          />
        </div>
      </div>
    </DocumentFlowShell>
  );
}
