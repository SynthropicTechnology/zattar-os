'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { EditorField, SignatureFieldType, Signatario } from '../types';

interface UsePaletteDragProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  templateId: string | number;
  currentPage: number;
  fieldsLength: number;
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>;
  setSelectedField: (field: EditorField | null) => void;
  markDirty: () => void;
}

interface UsePaletteDragReturn {
  draggedFieldType: SignatureFieldType | null;
  handlePaletteDragStart: (fieldType: SignatureFieldType) => void;
  handlePaletteDragEnd: () => void;
  handleCanvasDrop: (
    event: React.DragEvent<HTMLDivElement>,
    activeSigner: Signatario | null
  ) => void;
  handleCanvasDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Field configuration for each signature field type
 */
const FIELD_CONFIGS: Record<
  SignatureFieldType,
  {
    nome: string;
    variavel: string | undefined;
    tipo: 'texto' | 'assinatura' | 'texto_composto';
    width: number;
    height: number;
  }
> = {
  signature: {
    nome: 'Assinatura',
    variavel: 'assinatura.assinatura_base64',
    tipo: 'assinatura',
    width: 120,
    height: 60,
  },
  initials: {
    nome: 'Iniciais',
    variavel: 'assinatura.iniciais_base64',
    tipo: 'assinatura',
    width: 60,
    height: 40,
  },
  date: {
    nome: 'Data',
    variavel: 'assinatura.data_assinatura',
    tipo: 'texto',
    width: 100,
    height: 20,
  },
  textbox: {
    nome: 'Texto',
    variavel: 'texto_livre',
    tipo: 'texto',
    width: 200,
    height: 20,
  },
};

/**
 * Hook for managing drag & drop from the field palette to the canvas
 */
export function usePaletteDrag({
  canvasRef: _canvasRef,
  zoom,
  templateId,
  currentPage: _currentPage,
  fieldsLength,
  setFields,
  setSelectedField,
  markDirty,
}: UsePaletteDragProps): UsePaletteDragReturn {
  const [draggedFieldType, setDraggedFieldType] = useState<SignatureFieldType | null>(null);

  /**
   * Handle drag start from palette
   */
  const handlePaletteDragStart = useCallback((fieldType: SignatureFieldType) => {
    setDraggedFieldType(fieldType);
  }, []);

  /**
   * Handle drag end
   */
  const handlePaletteDragEnd = useCallback(() => {
    setDraggedFieldType(null);
  }, []);

  /**
   * Handle drag over canvas (allow drop)
   */
  const handleCanvasDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle drop on canvas
   */
  const handleCanvasDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, activeSigner: Signatario | null) => {
      event.preventDefault();

      const fieldType = event.dataTransfer.getData('field-type') as SignatureFieldType;
      if (!fieldType || !FIELD_CONFIGS[fieldType]) {
        setDraggedFieldType(null);
        return;
      }

      // Check for active signer
      if (!activeSigner) {
        toast.error('Selecione um signatário antes de adicionar campos');
        setDraggedFieldType(null);
        return;
      }

      // Find the page element where the drop occurred
      const target = event.target as HTMLElement;
      const pageElement = target.closest('[data-page]') as HTMLElement | null;

      if (!pageElement) {
        setDraggedFieldType(null);
        return;
      }

      // Get the actual page number from the element
      const dropPage = parseInt(pageElement.dataset.page || '1', 10);

      // Calculate drop position relative to the PAGE element, not the container
      const pageRect = pageElement.getBoundingClientRect();
      const x = (event.clientX - pageRect.left) / zoom;
      const y = (event.clientY - pageRect.top) / zoom;

      const config = FIELD_CONFIGS[fieldType];

      // Create new field
      const newField: EditorField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        template_id: String(templateId),
        nome: config.nome,
        variavel: config.variavel,
        tipo: config.tipo,
        posicao: {
          x: Math.round(x),
          y: Math.round(y),
          width: config.width,
          height: config.height,
          pagina: dropPage,
        },
        estilo: {
          fonte: 'Open Sans',
          tamanho_fonte: 12,
          cor: '#000000',
          alinhamento: 'left',
        },
        obrigatorio: true,
        ordem: fieldsLength + 1,
        criado_em: new Date(),
        atualizado_em: new Date(),
        isSelected: true,
        isDragging: false,
        justAdded: true,
        signatario_id: activeSigner.id,
      };

      setFields((prev) => [...prev.map((field) => ({ ...field, isSelected: false })), newField]);
      setSelectedField(newField);
      markDirty();
      setDraggedFieldType(null);

      toast.success(`Campo "${config.nome}" adicionado para ${activeSigner.nome}`);

      // Remove justAdded animation after 1s
      setTimeout(() => {
        setFields((prev) =>
          prev.map((field) => (field.id === newField.id ? { ...field, justAdded: false } : field))
        );
      }, 1000);
    },
    [zoom, templateId, fieldsLength, setFields, setSelectedField, markDirty]
  );

  return {
    draggedFieldType,
    handlePaletteDragStart,
    handlePaletteDragEnd,
    handleCanvasDrop,
    handleCanvasDragOver,
  };
}
