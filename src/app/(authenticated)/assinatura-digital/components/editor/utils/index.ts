/**
 * Editor Utilities
 *
 * Utility functions for the FieldMappingEditor component.
 */

export { validatePdfFile, formatFileSize } from './validate-pdf-file';

// Field helpers
export {
  estimateRichTextHeight,
  validateFieldHeight,
  calculateAutoHeight,
  normalizeFieldId,
  generateUniqueFieldId,
  fieldsToTemplateCampos,
  validateFieldIds,
} from './field-helpers';

// Field validators (re-exports + additional validators)
export {
  isValidField,
  isFieldInBounds,
  isValidFieldType,
} from './field-validators';

// Template helpers
export { normalizeTemplateFields, createNewField } from './template-helpers';

// Canvas helpers
export {
  calculateCanvasPosition,
  clampPosition,
  clampDimensions,
  calculateResizeDimensions,
  calculateDuplicatePosition,
  MIN_FIELD_SIZE,
  DRAG_THRESHOLD,
} from './canvas-helpers';

// PDF helpers
export {
  createPdfBlobUrl,
  revokePdfBlobUrl,
  isBlobUrl,
  isPreviewUrl,
  buildPreviewUrl,
  PDF_DIMENSIONS,
  MAX_PDF_SIZE,
  ALLOWED_PDF_TYPES,
} from './pdf-helpers';
