'use client';

import { useCallback, useState } from 'react';
import type { EditorField } from '../types';

/**
 * Estimates the height required for rich text content
 * Uses same heuristic as backend: lineHeight = fontSize * 1.2
 */
function estimateRichTextHeight(text: string, maxWidth: number, fontSize: number): number {
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
 * Hook for validating field heights, especially for rich text fields
 */
export function useFieldValidation() {
  const [fieldsWithHeightWarning, setFieldsWithHeightWarning] = useState<Set<string>>(new Set());

  /**
   * Validates if a field's height is sufficient for its content
   * Returns true if content overflows the field height
   */
  const validateFieldHeight = useCallback((field: EditorField): boolean => {
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
  }, []);

  /**
   * Updates the warning state for a field after validation
   */
  const updateFieldWarning = useCallback((field: EditorField) => {
    if (field.tipo !== 'texto_composto') return;

    const hasWarning = validateFieldHeight(field);
    setFieldsWithHeightWarning((prev) => {
      const next = new Set(prev);
      if (hasWarning) {
        next.add(field.id);
      } else {
        next.delete(field.id);
      }
      return next;
    });
  }, [validateFieldHeight]);

  /**
   * Calculates the automatic height adjustment for a rich text field
   * Returns the new height value with safety margin
   */
  const calculateAutoHeight = useCallback((field: EditorField): number | null => {
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
  }, []);

  /**
   * Removes height warning for a field
   */
  const clearFieldWarning = useCallback((fieldId: string) => {
    setFieldsWithHeightWarning((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
  }, []);

  /**
   * Adds height warning for a field
   */
  const addFieldWarning = useCallback((fieldId: string) => {
    setFieldsWithHeightWarning((prev) => new Set(prev).add(fieldId));
  }, []);

  return {
    fieldsWithHeightWarning,
    validateFieldHeight,
    updateFieldWarning,
    calculateAutoHeight,
    clearFieldWarning,
    addFieldWarning,
    estimateRichTextHeight,
  };
}
