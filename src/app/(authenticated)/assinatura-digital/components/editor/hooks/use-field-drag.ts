'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorField, DragState } from '../types';

interface UseFieldDragProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  editorMode: string;
  fields: EditorField[];
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>;
  setSelectedField: React.Dispatch<React.SetStateAction<EditorField | null>>;
  selectField: (fieldId: string) => void;
  markDirty: () => void;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  fieldId: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  offsetX: 0,
  offsetY: 0,
  hasMoved: false,
  mode: 'move',
  resizeHandle: null,
  startWidth: 0,
  startHeight: 0,
};

export function useFieldDrag({
  canvasRef,
  zoom,
  canvasWidth,
  canvasHeight,
  editorMode,
  setFields,
  setSelectedField,
  selectField,
  markDirty,
}: UseFieldDragProps) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  // Synchronous ref to track if user actually moved the mouse during drag.
  // Unlike dragState (async state), this ref updates instantly and is readable
  // in the click handler without stale closure issues.
  const hasMovedRef = useRef(false);

  const handleMouseDown = useCallback(
    (field: EditorField, event: React.MouseEvent) => {
      // Reset moved flag on every mousedown (including right-click)
      // so context menu and click handlers see the correct value
      hasMovedRef.current = false;

      // Only allow drag with left mouse button (button 0)
      if (event.button !== 0) return;

      // Only allow drag in 'select' mode
      if (editorMode !== 'select') return;

      // Prevent drag if clicked on resize handle
      const target = event.target as HTMLElement;
      const isResizeHandle =
        target.classList.contains('resize-handle') ||
        target.closest('.resize-handle') !== null;
      if (isResizeHandle) {
        return; // Let resize handle process the event
      }

      event.stopPropagation();
      event.preventDefault();

      // Select the field if not already selected
      if (!field.isSelected) {
        selectField(field.id);
      }

      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();

      setDragState({
        isDragging: true,
        fieldId: field.id,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        offsetX: event.clientX - rect.left - field.posicao.x * zoom,
        offsetY: event.clientY - rect.top - field.posicao.y * zoom,
        hasMoved: false,
        mode: 'move',
        resizeHandle: null,
        startWidth: field.posicao.width,
        startHeight: field.posicao.height,
      });
    },
    [editorMode, selectField, zoom, canvasRef]
  );

  const handleResizeMouseDown = useCallback(
    (
      field: EditorField,
      handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
      event: React.MouseEvent
    ) => {
      // Only allow resize with left mouse button
      if (event.button !== 0) return;
      if (editorMode !== 'select') return;

      event.stopPropagation();
      event.preventDefault();

      if (!field.isSelected) {
        selectField(field.id);
      }

      if (!canvasRef.current) return;

      setDragState({
        isDragging: true,
        fieldId: field.id,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        offsetX: 0,
        offsetY: 0,
        hasMoved: false,
        mode: 'resize',
        resizeHandle: handle,
        startWidth: field.posicao.width,
        startHeight: field.posicao.height,
      });
    },
    [editorMode, selectField, canvasRef]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.fieldId || !canvasRef.current) return;

      const DRAG_THRESHOLD = 3; // pixels
      const deltaX = Math.abs(event.clientX - dragState.startX);
      const deltaY = Math.abs(event.clientY - dragState.startY);

      // Only start drag if moved more than threshold
      if (!dragState.hasMoved && deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();

      // Mark that real movement occurred (both ref and state)
      if (!dragState.hasMoved) {
        hasMovedRef.current = true;
        setDragState((prev) => ({ ...prev, hasMoved: true }));
        // Mark the field as being dragged
        setFields((prev) =>
          prev.map((f) => (f.id === dragState.fieldId ? { ...f, isDragging: true } : f))
        );
      }

      // MOVE mode
      if (dragState.mode === 'move') {
        const newX = (event.clientX - rect.left - dragState.offsetX) / zoom;
        const newY = (event.clientY - rect.top - dragState.offsetY) / zoom;

        // Update field position
        setFields((prev) =>
          prev.map((field) => {
            if (field.id === dragState.fieldId) {
              return {
                ...field,
                posicao: {
                  ...field.posicao,
                  x: Math.max(0, Math.min(canvasWidth - field.posicao.width, Math.round(newX))),
                  y: Math.max(0, Math.min(canvasHeight - field.posicao.height, Math.round(newY))),
                },
                atualizado_em: new Date(),
              };
            }
            return field;
          })
        );

        // Update selectedField as well
        setSelectedField((prev) => {
          if (prev && prev.id === dragState.fieldId) {
            return {
              ...prev,
              posicao: {
                ...prev.posicao,
                x: Math.max(0, Math.min(canvasWidth - prev.posicao.width, Math.round(newX))),
                y: Math.max(0, Math.min(canvasHeight - prev.posicao.height, Math.round(newY))),
              },
              atualizado_em: new Date(),
            };
          }
          return prev;
        });
      }

      // RESIZE mode
      if (dragState.mode === 'resize' && dragState.resizeHandle) {
        const deltaMouseX = (event.clientX - dragState.startX) / zoom;
        const deltaMouseY = (event.clientY - dragState.startY) / zoom;

        setFields((prev) =>
          prev.map((field) => {
            if (field.id !== dragState.fieldId) return field;

            const MIN_SIZE = 20;
            let newX = field.posicao.x;
            let newY = field.posicao.y;
            let newWidth = dragState.startWidth;
            let newHeight = dragState.startHeight;

            const handle = dragState.resizeHandle!;

            // Calculate new dimensions based on handle
            if (handle.includes('e')) {
              newWidth = Math.max(MIN_SIZE, dragState.startWidth + deltaMouseX);
            }
            if (handle.includes('w')) {
              const proposedWidth = dragState.startWidth - deltaMouseX;
              if (proposedWidth >= MIN_SIZE) {
                newWidth = proposedWidth;
                newX = field.posicao.x + deltaMouseX;
              }
            }
            if (handle.includes('s')) {
              newHeight = Math.max(MIN_SIZE, dragState.startHeight + deltaMouseY);
            }
            if (handle.includes('n')) {
              const proposedHeight = dragState.startHeight - deltaMouseY;
              if (proposedHeight >= MIN_SIZE) {
                newHeight = proposedHeight;
                newY = field.posicao.y + deltaMouseY;
              }
            }

            // Apply canvas bounds
            newX = Math.max(0, Math.min(canvasWidth - newWidth, newX));
            newY = Math.max(0, Math.min(canvasHeight - newHeight, newY));
            newWidth = Math.min(newWidth, canvasWidth - newX);
            newHeight = Math.min(newHeight, canvasHeight - newY);

            return {
              ...field,
              posicao: {
                ...field.posicao,
                x: Math.round(newX),
                y: Math.round(newY),
                width: Math.round(newWidth),
                height: Math.round(newHeight),
              },
              atualizado_em: new Date(),
            };
          })
        );

        // Update selectedField
        setSelectedField((prev) => {
          if (!prev || prev.id !== dragState.fieldId) return prev;

          const MIN_SIZE = 20;
          let newX = prev.posicao.x;
          let newY = prev.posicao.y;
          let newWidth = dragState.startWidth;
          let newHeight = dragState.startHeight;

          const handle = dragState.resizeHandle!;

          if (handle.includes('e')) {
            newWidth = Math.max(MIN_SIZE, dragState.startWidth + deltaMouseX);
          }
          if (handle.includes('w')) {
            const proposedWidth = dragState.startWidth - deltaMouseX;
            if (proposedWidth >= MIN_SIZE) {
              newWidth = proposedWidth;
              newX = prev.posicao.x + deltaMouseX;
            }
          }
          if (handle.includes('s')) {
            newHeight = Math.max(MIN_SIZE, dragState.startHeight + deltaMouseY);
          }
          if (handle.includes('n')) {
            const proposedHeight = dragState.startHeight - deltaMouseY;
            if (proposedHeight >= MIN_SIZE) {
              newHeight = proposedHeight;
              newY = prev.posicao.y + deltaMouseY;
            }
          }

          newX = Math.max(0, Math.min(canvasWidth - newWidth, newX));
          newY = Math.max(0, Math.min(canvasHeight - newHeight, newY));
          newWidth = Math.min(newWidth, canvasWidth - newX);
          newHeight = Math.min(newHeight, canvasHeight - newY);

          return {
            ...prev,
            posicao: {
              ...prev.posicao,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            },
            atualizado_em: new Date(),
          };
        });
      }
    },
    [dragState, zoom, canvasWidth, canvasHeight, canvasRef, setFields, setSelectedField]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      // Prevent event propagation to avoid duplicate handlers
      event.stopPropagation();
      event.preventDefault();

      if (dragState.isDragging && dragState.fieldId) {
        // Remove dragging state from field
        setFields((prev) =>
          prev.map((f) => (f.id === dragState.fieldId ? { ...f, isDragging: false } : f))
        );

        // Mark as dirty only if there was real movement
        if (dragState.hasMoved) {
          markDirty();
        }

        setDragState(INITIAL_DRAG_STATE);
      }
    },
    [dragState, markDirty, setFields]
  );

  // Add global mouse listeners for drag
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    hasMovedRef,
    handleMouseDown,
    handleResizeMouseDown,
  };
}
