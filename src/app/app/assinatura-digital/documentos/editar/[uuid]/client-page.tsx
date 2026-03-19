"use client";

import { useDocumentEditor } from "../../../feature/components/editor/hooks/use-document-editor";
import { PDF_CANVAS_SIZE } from "../../../feature/types/pdf-preview.types";
import EditorCanvas from "../../../feature/components/editor/components/EditorCanvas";
import FloatingSidebar from "../../../feature/components/editor/components/FloatingSidebar";
import { Loader2 } from "lucide-react";

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
      <div className="flex w-full h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando documento...</span>
      </div>
    );
  }

  return (
    <div className="-m-6 h-[calc(100svh-(--spacing(14))-(--spacing(12)))] flex overflow-hidden bg-background">
      {/* PDF Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Indicador de salvamento — discreto no topo */}
        {isSaving && (
          <div className="absolute top-3 right-6 z-20">
            <span className="text-xs animate-pulse font-bold text-primary bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border">
              Salvando...
            </span>
          </div>
        )}

        {/* PDF Canvas - Scrollable */}
        <div className="flex-1 overflow-auto p-6 relative scroll-smooth scrollbar-custom bg-muted/30">
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
              onLoadError={(e: Error) => console.error("Error loading PDF", e)}
              fields={fields}
              fieldsWithHeightWarning={new Set()}
              onCanvasClick={handleCanvasClick}
              onFieldClick={(f, e) => handleFieldClick(f, e, dragState.isDragging)}
              onFieldMouseDown={handleFieldMouseDown}
              onFieldKeyboard={handleFieldKeyboard}
              onResizeMouseDown={handleResizeMouseDown}
              onDragOver={handleCanvasDragOver}
              onDrop={(e) => handleCanvasDrop(e, activeSigner)}
              selectedField={selectedField}
              onOpenProperties={() => { }}
              onDuplicateField={duplicateField}
              onDeleteField={deleteField}
              onAddTextField={() => { }}
              onAddImageField={() => { }}
              onAddRichTextField={() => { }}
              onEditRichText={() => { }}
              onAdjustHeight={() => { }}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              getSignerColor={getSignerColor}
              getSignerById={getSignerById}
              signers={signers}
              onReassignField={(fId, sId) => {
                setFields(prev => prev.map(f => f.id === fId ? { ...f, signatario_id: sId } : f));
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:flex w-85 shrink-0 border-l bg-background">
        <FloatingSidebar
          className="h-full flex flex-col"
          signers={signers}
          activeSigner={activeSigner}
          onSelectSigner={setActiveSigner}
          onAddSigner={handleAddSigner}
          onUpdateSigner={handleUpdateSigner}
          onDeleteSigner={handleDeleteSigner}
          fields={fields}
          onPaletteDragStart={() => { }}
          onPaletteDragEnd={() => { }}
          onReviewAndSend={handleSaveAndReview}
          documentTitle={documento.titulo ?? ''}
          selfieEnabled={documento.selfie_habilitada}
          onUpdateSettings={handleUpdateSettings}
        />
      </div>
    </div>
  );
}
