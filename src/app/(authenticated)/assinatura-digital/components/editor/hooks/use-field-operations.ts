'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { EditorField, EditorMode } from '../types';
import { calculateAutoHeight } from '../utils/field-helpers';

interface UseFieldOperationsProps {
  templateId: number | string;
  fields: EditorField[];
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>;
  currentPage: number;
  markDirty: () => void;
  setEditorMode: (mode: EditorMode) => void;
  setSelectedField: (field: EditorField | null) => void;
  setFieldsWithHeightWarning: React.Dispatch<React.SetStateAction<Set<string>>>;
  updateSelectedField: (updates: Partial<EditorField>) => void;
  selectedField: EditorField | null;
}

interface UseFieldOperationsReturn {
  handleAddTextField: () => void;
  handleAddImageField: () => void;
  handleAddRichTextField: () => void;
  handleEditRichText: (fieldId: string) => EditorField | undefined;
  handleAdjustHeightAutomatically: (fieldId: string) => void;
}

/**
 * Hook for field creation and manipulation operations
 * Handles adding new fields, editing rich text, and height adjustments
 */
export function useFieldOperations({
  templateId: _templateId,
  fields,
  setFields,
  currentPage: _currentPage,
  markDirty,
  setEditorMode,
  setSelectedField,
  setFieldsWithHeightWarning,
  updateSelectedField: _updateSelectedField,
  selectedField,
}: UseFieldOperationsProps): UseFieldOperationsReturn {
  /**
   * Set editor mode to add text field
   */
  const handleAddTextField = useCallback(() => {
    setEditorMode('add_text');
  }, [setEditorMode]);

  /**
   * Set editor mode to add image/signature field
   */
  const handleAddImageField = useCallback(() => {
    setEditorMode('add_image');
  }, [setEditorMode]);

  /**
   * Set editor mode to add rich text field
   */
  const handleAddRichTextField = useCallback(() => {
    setEditorMode('add_rich_text');
  }, [setEditorMode]);

  /**
   * Get field for rich text editing
   */
  const handleEditRichText = useCallback(
    (fieldId: string): EditorField | undefined => {
      const field = fields.find((f) => f.id === fieldId);
      if (field && field.tipo === 'texto_composto') {
        return field;
      }
      return undefined;
    },
    [fields]
  );

  /**
   * Automatically adjust field height based on content
   */
  const handleAdjustHeightAutomatically = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      if (!field || field.tipo !== 'texto_composto' || !field.conteudo_composto?.template) {
        return;
      }

      const newHeight = calculateAutoHeight(field);
      if (!newHeight) return;

      // Update field with new height
      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                posicao: { ...f.posicao, height: newHeight },
                atualizado_em: new Date(),
              }
            : f
        )
      );

      // Update selectedField if it's the current field
      if (selectedField?.id === fieldId) {
        setSelectedField({
          ...selectedField,
          posicao: { ...selectedField.posicao, height: newHeight },
          atualizado_em: new Date(),
        });
      }

      // Remove warning
      setFieldsWithHeightWarning((prev) => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });

      markDirty();
      toast.success('Altura ajustada automaticamente!');
    },
    [fields, selectedField, setFields, setSelectedField, setFieldsWithHeightWarning, markDirty]
  );

  return {
    handleAddTextField,
    handleAddImageField,
    handleAddRichTextField,
    handleEditRichText,
    handleAdjustHeightAutomatically,
  };
}
