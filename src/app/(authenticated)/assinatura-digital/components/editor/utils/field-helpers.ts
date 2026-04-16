/**
 * Field Helpers
 *
 * Utility functions for field manipulation in the FieldMappingEditor.
 * These are pure functions that handle field calculations and transformations.
 */

import type { EditorField } from '../types';
import type { TemplateCampo } from '@/shared/assinatura-digital/types/template.types';

/**
 * Estimates the height required for rich text content
 * Uses the same heuristic as the backend: lineHeight = fontSize * 1.2
 *
 * @param text - The text content to measure
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size in pixels
 * @returns Estimated height in pixels
 */
export function estimateRichTextHeight(text: string, maxWidth: number, fontSize: number): number {
  const avgCharWidth = fontSize * 0.55;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lineHeight = fontSize * 1.2;

  const paragraphs = text.split('\n');
  let totalLines = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) totalLines++;
        currentLine = word;
      }
    }
    if (currentLine) totalLines++;
  }

  return totalLines * lineHeight;
}

/**
 * Validates if a rich text field height is sufficient for its content
 *
 * @param field - The editor field to validate
 * @returns true if height is insufficient (warning), false otherwise
 */
export function validateFieldHeight(field: EditorField): boolean {
  if (field.tipo !== 'texto_composto' || !field.conteudo_composto?.template) {
    return false;
  }

  const fontSize = field.estilo?.tamanho_fonte || 12;
  const estimatedHeight = estimateRichTextHeight(
    field.conteudo_composto.template,
    field.posicao.width,
    fontSize
  );

  return estimatedHeight > field.posicao.height;
}

/**
 * Calculates the auto-adjusted height for a rich text field
 * Adds a safety margin to ensure content fits
 *
 * @param field - The editor field to calculate height for
 * @returns The recommended height, or null if not applicable
 */
export function calculateAutoHeight(field: EditorField): number | null {
  if (field.tipo !== 'texto_composto' || !field.conteudo_composto?.template) {
    return null;
  }

  const fontSize = field.estilo?.tamanho_fonte || 12;
  const estimatedHeight = estimateRichTextHeight(
    field.conteudo_composto.template,
    field.posicao.width,
    fontSize
  );

  // Add safety margin (12-14px)
  return Math.ceil(estimatedHeight) + 14;
}

/**
 * Normalizes a field ID from backend format to editor format
 * Backend returns numbers, editor expects strings
 *
 * @param campo - The template campo from backend
 * @returns Normalized string ID
 */
export function normalizeFieldId(campo: TemplateCampo): string {
  if (campo.id != null) {
    return String(campo.id);
  }
  // Generate unique ID if backend didn't return one
  return `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a unique field ID for new fields
 *
 * @returns A unique field ID string
 */
export function generateUniqueFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts EditorField array to TemplateCampo array for API submission
 * Removes editor-specific properties and temporary IDs
 *
 * @param fields - Array of editor fields
 * @returns Array of template campos suitable for API submission
 */
export function fieldsToTemplateCampos(fields: EditorField[]): TemplateCampo[] {
  return fields.map(({ isSelected, isDragging, justAdded, ...field }) => {
    // Remove editor-specific properties
    void isSelected;
    void isDragging;
    void justAdded;

    // Remove temporary IDs (those starting with 'field-')
    if (typeof field.id === 'string' && field.id.startsWith('field-')) {
      const { id, ...rest } = field;
      void id;
      return rest as TemplateCampo;
    }
    return field;
  });
}

/**
 * Validates uniqueness of field IDs
 *
 * @param fields - Array of editor fields
 * @returns Object with validation result and set of duplicate IDs
 */
export function validateFieldIds(fields: EditorField[]): {
  valid: boolean;
  duplicates: Set<string>;
} {
  const idSet = new Set<string>();
  const duplicates = new Set<string>();

  for (const field of fields) {
    if (idSet.has(field.id)) {
      duplicates.add(field.id);
    }
    idSet.add(field.id);
  }

  return {
    valid: duplicates.size === 0,
    duplicates,
  };
}
