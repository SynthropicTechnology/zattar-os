'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { EditorField } from '../types';

interface CanvasSize {
  width: number;
  height: number;
}

interface UseFieldSelectionProps {
  fields: EditorField[];
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>;
  selectedField: EditorField | null;
  setSelectedField: React.Dispatch<React.SetStateAction<EditorField | null>>;
  currentPage: number;
  markDirty: () => void;
  canvasSize: CanvasSize;
  setFieldsWithHeightWarning?: React.Dispatch<React.SetStateAction<Set<string>>>;
  validateFieldHeight?: (field: EditorField) => boolean;
}

/**
 * Hook for managing field selection, deletion, and duplication
 */
export function useFieldSelection({
  fields,
  setFields,
  selectedField,
  setSelectedField,
  currentPage: _currentPage,
  markDirty,
  canvasSize,
  setFieldsWithHeightWarning,
  validateFieldHeight,
}: UseFieldSelectionProps) {
  // Select a field by ID
  const selectField = useCallback(
    (fieldId: string) => {
      setFields((prev) => {
        const updatedFields = prev.map((field) => ({
          ...field,
          isSelected: field.id === fieldId,
        }));

        // Find the selected field in the updated array
        const selected = updatedFields.find((f) => f.id === fieldId) || null;

        // Update selectedField within the same update cycle
        setSelectedField(selected);

        return updatedFields;
      });
    },
    [setFields, setSelectedField]
  );

  // Note: In continuous scroll mode (all pages visible), we don't need to
  // clear selection based on page changes. This logic is disabled.
  // If you need single-page mode behavior, uncomment the useEffect below.
  /*
  useEffect(() => {
    if (selectedField && selectedField.posicao.pagina !== currentPage) {
      setFields((prev) => prev.map((field) => ({ ...field, isSelected: false })));
      setSelectedField(null);
    }
  }, [currentPage, selectedField, setFields, setSelectedField]);
  */

  // Delete a field
  const deleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, isSelected: false, isDragging: true } : field
        )
      );

      setTimeout(() => {
        setFields((prev) => prev.filter((field) => field.id !== fieldId));
        setSelectedField(null);
      }, 300);

      markDirty();
      toast.success('Campo removido com sucesso!');
    },
    [setFields, setSelectedField, markDirty]
  );

  // Duplicate a field
  const duplicateField = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) return;

      const newField: EditorField = {
        ...field,
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nome: field.nome, // Keep original name (variable label)
        posicao: {
          ...field.posicao,
          x: Math.min(field.posicao.x + 20, canvasSize.width - field.posicao.width),
          y: Math.min(field.posicao.y + 20, canvasSize.height - field.posicao.height),
        },
        isSelected: true,
        isDragging: false,
        justAdded: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      };

      setFields((prev) => [...prev.map((f) => ({ ...f, isSelected: false })), newField]);

      setSelectedField(newField);
      markDirty();
      toast.success('Campo duplicado com sucesso!');

      // Remove justAdded animation after 1s
      setTimeout(() => {
        setFields((prev) => prev.map((f) => (f.id === newField.id ? { ...f, justAdded: false } : f)));
      }, 1000);
    },
    [fields, setFields, setSelectedField, markDirty, canvasSize.width, canvasSize.height]
  );

  // Update the selected field with partial updates
  const updateSelectedField = useCallback(
    (updates: Partial<EditorField>) => {
      if (!selectedField) return;

      const updatedField: EditorField = {
        ...selectedField,
        ...updates,
        atualizado_em: new Date(),
      };

      setFields((prev) =>
        prev.map((field) => (field.id === selectedField.id ? { ...updatedField } : field))
      );

      setSelectedField(updatedField);
      markDirty();

      // Re-validate height for rich text fields
      if (
        updatedField.tipo === 'texto_composto' &&
        validateFieldHeight &&
        setFieldsWithHeightWarning
      ) {
        const hasWarning = validateFieldHeight(updatedField);
        setFieldsWithHeightWarning((prev) => {
          const next = new Set(prev);
          if (hasWarning) {
            next.add(updatedField.id);
          } else {
            next.delete(updatedField.id);
          }
          return next;
        });
      }
    },
    [selectedField, setFields, setSelectedField, markDirty, validateFieldHeight, setFieldsWithHeightWarning]
  );

  // Handle field click for selection
  const handleFieldClick = useCallback(
    (field: EditorField, event: React.MouseEvent, isDragging: boolean) => {
      event.stopPropagation();

      // Prevent selection during drag
      if (isDragging) return;

      selectField(field.id);
    },
    [selectField]
  );

  // Handle keyboard events on fields
  const handleFieldKeyboard = useCallback(
    (field: EditorField, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectField(field.id);
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && field.isSelected) {
        event.preventDefault();
        setFields((prev) =>
          prev.map((item) =>
            item.id === field.id ? { ...item, isSelected: false, isDragging: true } : item
          )
        );
        setTimeout(() => {
          setFields((prev) => prev.filter((item) => item.id !== field.id));
          setSelectedField(null);
        }, 300);
        markDirty();
        toast.success('Campo removido com sucesso!');
      }
    },
    [selectField, setFields, setSelectedField, markDirty]
  );

  return {
    selectField,
    deleteField,
    duplicateField,
    updateSelectedField,
    handleFieldClick,
    handleFieldKeyboard,
  };
}
