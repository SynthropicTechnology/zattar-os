'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { PDF_CANVAS_SIZE } from '@/shared/assinatura-digital/types/pdf-preview.types';
import type { Template } from '@/shared/assinatura-digital/types/template.types';
import PropertiesPopover from './PropertiesPopover';
import TemplateInfoPopover from './TemplateInfoPopover';
import ReplacePdfDialog from './ReplacePdfDialog';
import { RichTextEditorPopover } from './RichTextEditorPopover';

// Extracted hooks
import {
  useSaveOperations,
  useZoomPan,
  useFieldSelection,
  useFieldDrag,
  useToolbarDrag,
  useUnsavedChanges,
  useTemplateLoader,
  usePdfOperations,
  usePreview,
  useFieldOperations,
  useTemplateFormularios,
} from './hooks';

// Extracted components
import {
  EditorToolbar,
  EditorToolbarMobile,
  EditorCanvas,
  PreviewPanel,
  CreateModePanelUpload,
  CreateModePanelForm,
} from './components';
// Extracted utilities
import { validateFieldHeight } from './utils/field-helpers';
import styles from './FieldMappingEditor.module.css';

import type { EditorField, EditorMode } from './types';

interface FieldMappingEditorProps {
  template: Template;
  onCancel?: () => void;
  mode?: 'edit' | 'create';
}

export default function FieldMappingEditor({
  template,
  onCancel,
  mode = 'edit',
}: FieldMappingEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasSize = PDF_CANVAS_SIZE;

  // ===== State Management =====

  // Editor mode and UI state
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilledPreview, setShowFilledPreview] = useState(false);

  // Modal/popover state
  const [showProperties, setShowProperties] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [showReplacePdf, setShowReplacePdf] = useState(false);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [editingRichTextField, setEditingRichTextField] = useState<EditorField | null>(null);

  // Template creation state
  const [createdTemplate, setCreatedTemplate] = useState<Template | null>(null);

  // Field height warnings
  const [fieldsWithHeightWarning, setFieldsWithHeightWarning] = useState<Set<string>>(new Set());

  // ===== Custom Hooks =====

  // Formulario field names for variable insertion
  const formularioFieldNames = useTemplateFormularios(template);

  // Template loading
  const {
    fields,
    setFields,
    isLoading,
    pdfUrl,
    setPdfUrl,
    templatePdfUrl,
    setTemplatePdfUrl: _setTemplatePdfUrl,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    selectedField,
    setSelectedField,
    previewKey,
    setPreviewKey,
  } = useTemplateLoader({ template, mode });

  // PDF operations (for create mode)
  const {
    uploadedFile,
    setUploadedFile: _setUploadedFile,
    uploadedFilePreview: _uploadedFilePreview,
    setUploadedFilePreview: _setUploadedFilePreview,
    handleFileUpload,
    clearUploadedFile,
  } = usePdfOperations({
    mode,
    setPdfUrl,
    setPreviewKey,
  });

  // Zoom and pan
  const {
    zoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    canResetZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  } = useZoomPan({ canvasSize });

  // Unsaved changes protection
  const {
    markDirty,
    handleCancel: handleUnsavedCancel,
    showExitConfirmation,
    setShowExitConfirmation,
    pendingNavigation,
    setPendingNavigation,
  } = useUnsavedChanges({
    hasUnsavedChanges,
    setHasUnsavedChanges,
    onCancel,
    router,
  });

  // Field selection
  const { selectField, deleteField, duplicateField, updateSelectedField } = useFieldSelection({
    fields,
    setFields,
    selectedField,
    setSelectedField,
    currentPage,
    markDirty,
    canvasSize,
    setFieldsWithHeightWarning,
    validateFieldHeight: (field) => validateFieldHeight(field),
  });

  // Field drag and resize
  const { dragState: _dragState, hasMovedRef, handleMouseDown, handleResizeMouseDown } = useFieldDrag({
    canvasRef,
    zoom,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    editorMode,
    fields,
    setFields,
    setSelectedField,
    selectField,
    markDirty,
  });

  // Toolbar drag
  const { toolbarPosition, handleToolbarMouseDown, handleToolbarTouchStart } = useToolbarDrag();

  // Preview generation
  const {
    isGeneratingPreview,
    showPreviewModal,
    setShowPreviewModal,
    previewPdfUrl,
    setPreviewPdfUrl: _setPreviewPdfUrl,
    iframeLoadFailed,
    handleGenerateTestPreview,
    handleIframeLoad,
    handleIframeError,
    downloadPdf,
  } = usePreview({
    template,
    fields,
    mode,
    createdTemplate,
    showFilledPreview,
    setPdfUrl,
    setPreviewKey,
  });

  // Field operations
  const {
    handleAddTextField,
    handleAddImageField,
    handleAddRichTextField,
    handleEditRichText: getFieldForRichTextEdit,
    handleAdjustHeightAutomatically,
  } = useFieldOperations({
    templateId: template.id,
    fields,
    setFields,
    currentPage,
    markDirty,
    setEditorMode,
    setSelectedField,
    setFieldsWithHeightWarning,
    updateSelectedField,
    selectedField,
  });

  // Save operations (autosave + manual save)
  const { saveTemplate } = useSaveOperations({
    templateId: template.id,
    template,
    fields,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  });

  // ===== Event Handlers =====

  // Canvas click handler
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      // In select mode, deselect all fields when clicking empty canvas
      if (editorMode === 'select') {
        setFields((prev) => prev.map((field) => ({ ...field, isSelected: false })));
        setSelectedField(null);
        return;
      }

      // Use the clicked page element for position relative to that specific page
      const pageElement = event.currentTarget as HTMLDivElement;
      const rect = pageElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;

      // Get the page number from the clicked page element's data attribute
      const clickedPage = parseInt(pageElement.dataset.page || String(currentPage), 10);

      // Create new field based on editor mode
      const fieldConfig = {
        add_text: {
          nome: 'Nome Completo',
          variavel: 'cliente.nome_completo',
          tipo: 'texto' as const,
          width: 200,
          height: 20,
        },
        add_image: {
          nome: 'Assinatura',
          variavel: 'assinatura.assinatura_base64',
          tipo: 'assinatura' as const,
          width: 120,
          height: 60,
        },
        add_rich_text: {
          nome: 'Texto Composto',
          variavel: undefined,
          tipo: 'texto_composto' as const,
          width: 400,
          height: 80,
        },
      };

      const config = fieldConfig[editorMode as keyof typeof fieldConfig];
      if (!config) return;

      const newField: EditorField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        template_id: String(template.id),
        nome: config.nome,
        variavel: config.variavel,
        tipo: config.tipo,
        posicao: {
          x: Math.round(x),
          y: Math.round(y),
          width: config.width,
          height: config.height,
          pagina: clickedPage,
        },
        estilo: {
          fonte: 'Open Sans',
          tamanho_fonte: 12,
          cor: '#000000',
          alinhamento: 'left',
        },
        obrigatorio: true,
        ordem: fields.length + 1,
        conteudo_composto:
          config.tipo === 'texto_composto'
            ? { json: { type: 'doc', content: [{ type: 'paragraph' }] }, template: '' }
            : undefined,
        criado_em: new Date(),
        atualizado_em: new Date(),
        isSelected: true,
        isDragging: false,
        justAdded: true,
      };

      setFields((prev) => [...prev.map((field) => ({ ...field, isSelected: false })), newField]);
      setSelectedField(newField);
      setEditorMode('select');
      markDirty();
      toast.success('Campo adicionado');

      // Validate height for rich text fields
      if (config.tipo === 'texto_composto') {
        const hasWarning = validateFieldHeight(newField);
        if (hasWarning) {
          setFieldsWithHeightWarning((prev) => new Set(prev).add(newField.id));
        }
      }

      // Remove justAdded animation after 1s
      setTimeout(() => {
        setFields((prev) =>
          prev.map((field) => (field.id === newField.id ? { ...field, justAdded: false } : field))
        );
      }, 1000);
    },
    [editorMode, zoom, fields.length, template.id, markDirty, currentPage, setFields, setSelectedField, setEditorMode]
  );

  // Field click handler — select + open properties
  // Uses hasMovedRef (synchronous ref) instead of dragState.isDragging (async state)
  // to avoid stale closure: mousedown sets isDragging=true via setState, but the
  // click event fires before React re-renders with isDragging=false from mouseup.
  const handleFieldClick = useCallback(
    (field: EditorField, event: React.MouseEvent) => {
      event.stopPropagation();
      if (hasMovedRef.current) return; // Only skip if user actually dragged
      selectField(field.id);
      setShowProperties(true);
    },
    [selectField, hasMovedRef]
  );

  // Field keyboard handler
  const handleFieldKeyboard = useCallback(
    (field: EditorField, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectField(field.id);
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && field.isSelected) {
        event.preventDefault();
        deleteField(field.id);
      }
    },
    [selectField, deleteField]
  );

  // Toggle preview between original and filled
  const handleTogglePreview = useCallback(() => {
    setShowFilledPreview((prev) => {
      const newValue = !prev;
      if (newValue && previewPdfUrl) {
        setPdfUrl(previewPdfUrl);
      } else if (templatePdfUrl) {
        setPdfUrl(templatePdfUrl);
      }
      setPreviewKey((prev) => prev + 1);
      return newValue;
    });
  }, [previewPdfUrl, templatePdfUrl, setPdfUrl, setPreviewKey]);

  // Page navigation handlers
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(prev + 1, totalPages);
      setSelectedField((selected) =>
        selected && selected.posicao.pagina !== next ? null : selected
      );
      setFields((fields) =>
        fields.map((f) => (f.posicao.pagina !== next ? { ...f, isSelected: false } : f))
      );
      return next;
    });
  }, [totalPages, setSelectedField, setFields]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(prev - 1, 1);
      setSelectedField((selected) =>
        selected && selected.posicao.pagina !== next ? null : selected
      );
      setFields((fields) =>
        fields.map((f) => (f.posicao.pagina !== next ? { ...f, isSelected: false } : f))
      );
      return next;
    });
  }, [setSelectedField, setFields]);

  // PDF load success handler
  const handlePdfLoadSuccess = useCallback((numPages: number) => {
    setTotalPages(numPages);
  }, []);

  // Open properties handler
  const handleOpenProperties = useCallback(() => {
    setShowProperties(true);
  }, []);

  // Open template info handler
  const handleOpenTemplateInfo = useCallback(() => {
    setShowTemplateInfo(true);
  }, []);

  // Replace PDF handler
  const handleReplacePdfClick = useCallback(() => {
    setShowReplacePdf(true);
  }, []);

  // Edit rich text handler
  const handleEditRichText = useCallback(
    (fieldId: string) => {
      const field = getFieldForRichTextEdit(fieldId);
      if (field) {
        setEditingRichTextField(field);
        setShowRichTextEditor(true);
        setShowProperties(false); // Close properties when opening rich text editor
      }
    },
    [getFieldForRichTextEdit]
  );

  // Template info update handler
  const handleTemplateInfoUpdate = useCallback(
    async (updates: Partial<Template>) => {
      try {
        if (mode === 'create') {
          const newTemplate = updates as Template;
          setCreatedTemplate(newTemplate);
          setPdfUrl(`/api/assinatura-digital/templates/${newTemplate.id}/preview`);
          setPreviewKey((prev) => prev + 1);
          router.replace(`/assinatura-digital/templates/${newTemplate.id}/edit`);
          toast.success('Template criado! Agora você pode mapear os campos.');
          return;
        }

        const response = await fetch(`/api/assinatura-digital/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.message || 'Erro desconhecido ao atualizar o template.';
          throw new Error(errorMessage);
        }

        Object.assign(template, updates);
      } catch (error) {
        console.error('Erro ao atualizar informações do template:', error);
        throw error;
      }
    },
    [template, mode, router, setPdfUrl, setPreviewKey]
  );

  // Replace PDF success handler
  const handleReplacePdfSuccess = useCallback(async () => {
    try {
      const templateId = createdTemplate?.id || template.id;

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.loading('Atualizando dados do template...');
      const response = await fetch(`/api/assinatura-digital/templates/${templateId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados atualizados do template');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Erro ao buscar dados atualizados do template');
      }

      const updatedTemplate = result.data;
      Object.assign(template, {
        arquivo_original: updatedTemplate.arquivo_original,
        arquivo_nome: updatedTemplate.arquivo_nome,
        arquivo_tamanho: updatedTemplate.arquivo_tamanho,
      });

      const newPdfUrl = `/api/assinatura-digital/templates/${templateId}/preview?t=${Date.now()}`;
      setPdfUrl(newPdfUrl);
      setPreviewKey((prev) => prev + 1);

      toast.dismiss();
      toast.success('PDF substituído com sucesso!');
    } catch (error) {
      console.error('[REPLACE_PDF_SUCCESS] Erro ao recarregar dados do template:', error);
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar preview. Recarregue a página.'
      );
    }
  }, [template, createdTemplate, setPdfUrl, setPreviewKey]);

  // Create template submit handler
  const handleCreateTemplateSubmit = async (data: {
    nome: string;
    descricao: string;
    conteudo_markdown?: string;
  }) => {
    if (!uploadedFile) {
      toast.error('Arquivo PDF não encontrado');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadedFile);
      formDataToSend.append('nome', data.nome.trim());
      formDataToSend.append('descricao', data.descricao.trim());
      if (data.conteudo_markdown && data.conteudo_markdown.trim()) {
        formDataToSend.append('conteudo_markdown', data.conteudo_markdown.trim());
      }

      const response = await fetch('/api/assinatura-digital/templates', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar template');
      }

      const result = await response.json();
      toast.success('Template criado com sucesso!');

      const newTemplate = result.data;
      setCreatedTemplate(newTemplate);
      setPdfUrl(`/api/assinatura-digital/templates/${newTemplate.id}/preview`);
      setPreviewKey((prev) => prev + 1);
      router.replace(`/assinatura-digital/templates/${newTemplate.id}/edit`);
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar template');
      throw error;
    }
  };

  // ===== Effects =====

  // Close properties popover when no field is selected
  useEffect(() => {
    if (!selectedField) {
      setShowProperties(false);
    }
  }, [selectedField]);


  // ===== Render =====

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="font-medium text-muted-foreground">Carregando {template.nome}...</p>
          <p className="text-sm text-muted-foreground/80">Preparando editor de campos.</p>
        </div>
      </div>
    );
  }

  // Create mode: no PDF uploaded yet
  if (mode === 'create' && !uploadedFile) {
    return <CreateModePanelUpload onFileUpload={handleFileUpload} />;
  }

  // Create mode: PDF uploaded, show form
  if (mode === 'create' && uploadedFile && !createdTemplate) {
    return (
      <CreateModePanelForm
        uploadedFile={uploadedFile}
        onSubmit={handleCreateTemplateSubmit}
        onCancel={clearUploadedFile}
      />
    );
  }

  // Toolbar props
  const toolbarProps = {
    editorMode,
    onModeChange: setEditorMode,
    onAddRichTextField: handleAddRichTextField,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    canResetZoom,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetZoom: handleResetZoom,
    currentPage,
    totalPages,
    onNextPage: handleNextPage,
    onPreviousPage: handlePreviousPage,
    hasSelectedField: !!selectedField,
    onOpenProperties: handleOpenProperties,
    onOpenTemplateInfo: handleOpenTemplateInfo,
    onReplacePdf: handleReplacePdfClick,
    onCancel: handleUnsavedCancel,
    onSave: saveTemplate,
    onGenerateTestPreview: handleGenerateTestPreview,
    isGeneratingPreview,
    pdfUrl,
    isCreateMode: mode === 'create',
    hasTemplateId: !!template?.id,
    showFilledPreview,
    onTogglePreview: handleTogglePreview,
    hasPreviewPdf: !!previewPdfUrl,
  };

  return (
    <div className="-m-6 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Mobile Toolbar (horizontal at top) */}
      <EditorToolbarMobile {...toolbarProps} />

      {/* Canvas Area with floating toolbar */}
      <div className={`relative flex-1 overflow-auto bg-muted/40 ${styles.canvasBackground}`}>
        {/* Desktop Toolbar - Floating & Draggable */}
        <EditorToolbar
          toolbarPosition={toolbarPosition}
          onMouseDown={handleToolbarMouseDown}
          onTouchStart={handleToolbarTouchStart}
          {...toolbarProps}
        />

        {/* Popovers (rendered outside layout flow) */}
        <PropertiesPopover
          open={showProperties}
          onOpenChange={setShowProperties}
          selectedField={selectedField}
          fieldsLength={fields.length}
          onUpdateField={updateSelectedField}
          onDeleteField={deleteField}
          onEditRichText={handleEditRichText}
        />

        <TemplateInfoPopover
          open={showTemplateInfo}
          onOpenChange={setShowTemplateInfo}
          template={createdTemplate || template}
          onUpdate={handleTemplateInfoUpdate}
          isCreating={mode === 'create' && !createdTemplate}
          pdfFile={uploadedFile || undefined}
        />

        {/* Centered PDF Canvas */}
        <div className="flex min-h-full items-start justify-center p-8">
          <EditorCanvas
            canvasRef={canvasRef}
            canvasSize={canvasSize}
            zoom={zoom}
            pdfUrl={pdfUrl}
            previewKey={previewKey}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onLoadSuccess={handlePdfLoadSuccess}
            onLoadError={(error) => {
              toast.error('Não foi possível carregar o preview do PDF.', {
                description: error.message,
              });
            }}
            fields={fields}
            fieldsWithHeightWarning={fieldsWithHeightWarning}
            onCanvasClick={handleCanvasClick}
            onFieldClick={handleFieldClick}
            onFieldMouseDown={handleMouseDown}
            onFieldKeyboard={handleFieldKeyboard}
            onResizeMouseDown={handleResizeMouseDown}
            selectedField={selectedField}
            onOpenProperties={handleOpenProperties}
            onDuplicateField={duplicateField}
            onDeleteField={deleteField}
            onAddTextField={handleAddTextField}
            onAddImageField={handleAddImageField}
            onAddRichTextField={handleAddRichTextField}
            onEditRichText={handleEditRichText}
            onAdjustHeight={handleAdjustHeightAutomatically}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
          />
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowExitConfirmation(false)}>
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                setHasUnsavedChanges(false);
                const navigation =
                  pendingNavigation ??
                  (onCancel ? () => onCancel() : () => router.push('/app/assinatura-digital/templates'));
                setPendingNavigation(null);
                navigation();
              }}
            >
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <PreviewPanel
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        previewPdfUrl={previewPdfUrl}
        iframeLoadFailed={iframeLoadFailed}
        templateName={template.nome}
        onIframeLoad={handleIframeLoad}
        onIframeError={handleIframeError}
        onDownloadPdf={downloadPdf}
      />

      {/* Replace PDF Dialog */}
      <ReplacePdfDialog
        open={showReplacePdf}
        onOpenChange={setShowReplacePdf}
        templateId={createdTemplate?.id || template.id}
        onSuccess={handleReplacePdfSuccess}
      />

      {/* Rich Text Editor Dialog */}
      {editingRichTextField && (
        <RichTextEditorPopover
          open={showRichTextEditor}
          onOpenChange={setShowRichTextEditor}
          value={editingRichTextField.conteudo_composto}
          onChange={(conteudo) => {
            if (editingRichTextField) {
              updateSelectedField({ conteudo_composto: conteudo });
              setEditingRichTextField({
                ...editingRichTextField,
                conteudo_composto: conteudo,
              });
            }
          }}
          fieldName={editingRichTextField.nome || ''}
          formularios={formularioFieldNames}
          fieldWidth={editingRichTextField.posicao.width}
          fieldHeight={editingRichTextField.posicao.height}
          fontSize={editingRichTextField.estilo?.tamanho_fonte || 12}
          onHeightAdjust={(newHeight) => {
            if (editingRichTextField) {
              updateSelectedField({
                posicao: {
                  ...editingRichTextField.posicao,
                  height: newHeight,
                },
              });
              setEditingRichTextField({
                ...editingRichTextField,
                posicao: {
                  ...editingRichTextField.posicao,
                  height: newHeight,
                },
              });
            }
          }}
        />
      )}
    </div>
  );
}
