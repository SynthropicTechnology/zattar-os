/**
 * Canvas Helpers
 *
 * Utility functions for canvas calculations in the FieldMappingEditor.
 * Handles position calculations, clamping, and coordinate transformations.
 */

import type React from 'react';

/**
 * Calculates the canvas position from a mouse event
 *
 * @param event - The mouse event
 * @param canvasRef - Reference to the canvas element
 * @param zoom - Current zoom level
 * @returns The x and y position in canvas coordinates
 */
export function calculateCanvasPosition(
  event: React.MouseEvent,
  canvasRef: React.RefObject<HTMLDivElement>,
  zoom: number
): { x: number; y: number } {
  if (!canvasRef.current) {
    return { x: 0, y: 0 };
  }

  const rect = canvasRef.current.getBoundingClientRect();
  const x = (event.clientX - rect.left) / zoom;
  const y = (event.clientY - rect.top) / zoom;

  return { x, y };
}

/**
 * Clamps a position to stay within canvas bounds
 *
 * @param x - X position
 * @param y - Y position
 * @param width - Element width
 * @param height - Element height
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @returns Clamped x and y positions
 */
export function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(canvasWidth - width, Math.round(x))),
    y: Math.max(0, Math.min(canvasHeight - height, Math.round(y))),
  };
}

/**
 * Clamps dimensions to stay within canvas bounds
 *
 * @param width - Element width
 * @param height - Element height
 * @param x - Element X position
 * @param y - Element Y position
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @returns Clamped width and height
 */
export function clampDimensions(
  width: number,
  height: number,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): { width: number; height: number } {
  return {
    width: Math.min(width, canvasWidth - x),
    height: Math.min(height, canvasHeight - y),
  };
}

/**
 * Minimum field size constant
 */
export const MIN_FIELD_SIZE = 20;

/**
 * Drag threshold in pixels - movement below this is not considered a drag
 */
export const DRAG_THRESHOLD = 3;

/**
 * Calculates new dimensions for a resize operation
 *
 * @param handle - The resize handle being dragged
 * @param deltaX - Mouse delta X
 * @param deltaY - Mouse delta Y
 * @param startWidth - Original width
 * @param startHeight - Original height
 * @param currentX - Current X position
 * @param currentY - Current Y position
 * @returns New x, y, width, and height values
 */
export function calculateResizeDimensions(
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
  deltaX: number,
  deltaY: number,
  startWidth: number,
  startHeight: number,
  currentX: number,
  currentY: number
): { x: number; y: number; width: number; height: number } {
  let newX = currentX;
  let newY = currentY;
  let newWidth = startWidth;
  let newHeight = startHeight;

  // Calculate new dimensions based on handle
  if (handle.includes('e')) {
    newWidth = Math.max(MIN_FIELD_SIZE, startWidth + deltaX);
  }
  if (handle.includes('w')) {
    const proposedWidth = startWidth - deltaX;
    if (proposedWidth >= MIN_FIELD_SIZE) {
      newWidth = proposedWidth;
      newX = currentX + deltaX;
    }
  }
  if (handle.includes('s')) {
    newHeight = Math.max(MIN_FIELD_SIZE, startHeight + deltaY);
  }
  if (handle.includes('n')) {
    const proposedHeight = startHeight - deltaY;
    if (proposedHeight >= MIN_FIELD_SIZE) {
      newHeight = proposedHeight;
      newY = currentY + deltaY;
    }
  }

  return {
    x: Math.round(newX),
    y: Math.round(newY),
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Calculates duplicate field position with offset
 *
 * @param originalX - Original X position
 * @param originalY - Original Y position
 * @param width - Field width
 * @param height - Field height
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @param offset - Offset in pixels (default 20)
 * @returns New x and y positions for the duplicate
 */
export function calculateDuplicatePosition(
  originalX: number,
  originalY: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  offset: number = 20
): { x: number; y: number } {
  return {
    x: Math.min(originalX + offset, canvasWidth - width),
    y: Math.min(originalY + offset, canvasHeight - height),
  };
}
