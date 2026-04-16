'use client';

/**
 * use-save-operations.ts
 *
 * Consolidates all save operations for the FieldMappingEditor component.
 *
 * The hook handles:
 * - Manual save via saveTemplate() - triggered by user action
 * - Automatic save (autosave) every 5 seconds when hasUnsavedChanges is true
 *
 * This is the primary save hook and should be used by FieldMappingEditor.
 * The underlying implementation is in use-autosave.ts (internal).
 */

export { useAutosave as useSaveOperations } from './use-autosave';
