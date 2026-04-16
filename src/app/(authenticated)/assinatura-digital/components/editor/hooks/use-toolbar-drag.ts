'use client';

import { useCallback, useEffect, useState } from 'react';

interface ToolbarPosition {
  x: number;
  y: number;
}

interface UseToolbarDragProps {
  initialPosition?: ToolbarPosition;
}

/**
 * Hook for managing draggable floating toolbar position
 * Supports both mouse and touch events for mobile compatibility
 */
export function useToolbarDrag({ initialPosition = { x: 300, y: 100 } }: UseToolbarDragProps = {}) {
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>(initialPosition);
  const [toolbarDragging, setToolbarDragging] = useState(false);
  const [toolbarDragOffset, setToolbarDragOffset] = useState({ x: 0, y: 0 });

  // Mouse handlers
  const handleToolbarMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setToolbarDragging(true);
      setToolbarDragOffset({
        x: event.clientX - toolbarPosition.x,
        y: event.clientY - toolbarPosition.y,
      });
    },
    [toolbarPosition]
  );

  const handleToolbarMouseMove = useCallback(
    (event: MouseEvent) => {
      if (toolbarDragging) {
        setToolbarPosition({
          x: event.clientX - toolbarDragOffset.x,
          y: event.clientY - toolbarDragOffset.y,
        });
      }
    },
    [toolbarDragging, toolbarDragOffset]
  );

  const handleToolbarMouseUp = useCallback(() => {
    setToolbarDragging(false);
  }, []);

  // Touch handlers (mobile support)
  const handleToolbarTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.stopPropagation();
      const touch = event.touches[0];
      setToolbarDragging(true);
      setToolbarDragOffset({
        x: touch.clientX - toolbarPosition.x,
        y: touch.clientY - toolbarPosition.y,
      });
    },
    [toolbarPosition]
  );

  const handleToolbarTouchMove = useCallback(
    (event: TouchEvent) => {
      if (toolbarDragging && event.touches.length > 0) {
        const touch = event.touches[0];
        setToolbarPosition({
          x: touch.clientX - toolbarDragOffset.x,
          y: touch.clientY - toolbarDragOffset.y,
        });
      }
    },
    [toolbarDragging, toolbarDragOffset]
  );

  const handleToolbarTouchEnd = useCallback(() => {
    setToolbarDragging(false);
  }, []);

  // Add drag listeners (mouse + touch)
  useEffect(() => {
    if (toolbarDragging) {
      window.addEventListener('mousemove', handleToolbarMouseMove);
      window.addEventListener('mouseup', handleToolbarMouseUp);
      window.addEventListener('touchmove', handleToolbarTouchMove);
      window.addEventListener('touchend', handleToolbarTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleToolbarMouseMove);
        window.removeEventListener('mouseup', handleToolbarMouseUp);
        window.removeEventListener('touchmove', handleToolbarTouchMove);
        window.removeEventListener('touchend', handleToolbarTouchEnd);
      };
    }
  }, [
    toolbarDragging,
    handleToolbarMouseMove,
    handleToolbarMouseUp,
    handleToolbarTouchMove,
    handleToolbarTouchEnd,
  ]);

  return {
    toolbarPosition,
    toolbarDragging,
    handleToolbarMouseDown,
    handleToolbarTouchStart,
  };
}
