export { default as CreateTemplateForm } from './CreateTemplateForm';
export { default as PdfCanvasArea } from './PdfCanvasArea';
export { default as PropertiesPopover } from './PropertiesPopover';
export { default as TemplateInfoPopover } from './TemplateInfoPopover';
export { default as ReplacePdfDialog } from './ReplacePdfDialog';
export { RichTextEditor } from './RichTextEditor';
export { RichTextEditorPopover } from './RichTextEditorPopover';
export { MarkdownRichTextEditor } from './MarkdownRichTextEditor';
export { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog';
export { Variable } from './extensions/Variable';
export { default as FieldMappingEditor } from './FieldMappingEditor';
export { default as ToolbarButtons } from './ToolbarButtons';
export { default as ToolbarButtonsMobile } from './ToolbarButtonsMobile';

// Template Texto (text-based templates with Plate editor)
export {
  TemplateTypeSelector,
  TemplateTextoEditor,
  TemplateTextoCreateForm,
  TEMPLATE_VARIABLES,
  CATEGORY_LABELS,
  getVariablesByCategory,
  getVariableByKey,
  type TemplateType,
  type TemplateVariable,
  type VariableCategory,
  type TemplateTextoMetadata,
  type TemplateTextoContent,
  type TemplateTextoFormData,
} from './template-texto';

// Editor hooks (extracted for maintainability)
export {
  useFieldDrag,
  useToolbarDrag,
  useSaveOperations,
  useZoomPan,
  useFieldSelection,
  useFieldValidation,
  useUnsavedChanges,
  useTemplateLoader,
  usePdfOperations,
  usePreview,
  useFieldOperations,
} from './hooks';

// Editor types
export type {
  EditorField,
  EditorMode,
  DragState,
  ResizeHandle,
  ApiPreviewTestResponse,
  CanvasSize,
  ToolbarPosition,
} from './types';

// Utilities
export {
  validatePdfFile,
  formatFileSize,
  // Field helpers
  estimateRichTextHeight,
  validateFieldHeight,
  calculateAutoHeight,
  normalizeFieldId,
  generateUniqueFieldId,
  fieldsToTemplateCampos,
  validateFieldIds,
  // Template helpers
  normalizeTemplateFields,
  createNewField,
  // Canvas helpers
  calculateCanvasPosition,
  clampPosition,
  clampDimensions,
  calculateResizeDimensions,
  calculateDuplicatePosition,
  MIN_FIELD_SIZE,
  DRAG_THRESHOLD,
} from './utils';

// Extracted UI components
export {
  EditorToolbar,
  EditorToolbarMobile,
  EditorCanvas,
  PreviewPanel,
  CreateModePanelUpload,
  CreateModePanelForm,
  FieldsList,
} from './components';