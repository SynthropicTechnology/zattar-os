'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ZOOM_CONFIG } from '@/shared/assinatura-digital/types/pdf-preview.types';

interface CanvasSize {
  width: number;
  height: number;
}

interface UseZoomPanProps {
  canvasSize: CanvasSize;
}

/**
 * Hook for managing zoom and pan functionality in the PDF canvas
 * Supports responsive auto-zoom on viewport resize
 */
export function useZoomPan({ canvasSize }: UseZoomPanProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM_CONFIG.default);
  const [hasManualZoom, setHasManualZoom] = useState(false);

  const clampZoomValue = useCallback(
    (value: number) =>
      Number(
        Math.min(DEFAULT_ZOOM_CONFIG.max, Math.max(DEFAULT_ZOOM_CONFIG.min, value)).toFixed(2)
      ),
    []
  );

  // Auto-zoom for viewport on mount and resize
  useEffect(() => {
    if (hasManualZoom) {
      return;
    }

    const updateZoomForViewport = () => {
      if (typeof window === 'undefined') return;

      // Account for: app sidebar (~256px collapsed ~48px), docked toolbar (~44px), canvas padding (64px)
      const availableWidth = window.innerWidth - 200; // sidebar + toolbar + padding
      const availableHeight = window.innerHeight - 180; // app header (56px) + editor header (48px) + canvas padding (76px)

      const zoomX = availableWidth / canvasSize.width;
      const zoomY = availableHeight / canvasSize.height;

      // Fit to screen (both dimensions), ensuring we don't zoom in beyond 1.0 automatically
      const responsiveZoom = Math.min(1, zoomX, zoomY);

      const clamped = clampZoomValue(responsiveZoom || DEFAULT_ZOOM_CONFIG.default);

      setZoom((prev) => (Math.abs(prev - clamped) < 0.01 ? prev : clamped));
    };

    updateZoomForViewport();
    window.addEventListener('resize', updateZoomForViewport);
    return () => window.removeEventListener('resize', updateZoomForViewport);
  }, [hasManualZoom, clampZoomValue, canvasSize.width, canvasSize.height]);

  const handleZoomIn = useCallback(() => {
    setHasManualZoom(true);
    setZoom((prev) => clampZoomValue(prev + DEFAULT_ZOOM_CONFIG.step));
  }, [clampZoomValue]);

  const handleZoomOut = useCallback(() => {
    setHasManualZoom(true);
    setZoom((prev) => clampZoomValue(prev - DEFAULT_ZOOM_CONFIG.step));
  }, [clampZoomValue]);

  const handleResetZoom = useCallback(() => {
    setHasManualZoom(true);
    setZoom(DEFAULT_ZOOM_CONFIG.default);
  }, []);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < DEFAULT_ZOOM_CONFIG.max;
  const canZoomOut = zoom > DEFAULT_ZOOM_CONFIG.min;
  const canResetZoom = Math.abs(zoom - DEFAULT_ZOOM_CONFIG.default) >= 0.01;

  return {
    zoom,
    setZoom,
    hasManualZoom,
    setHasManualZoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    canResetZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  };
}
