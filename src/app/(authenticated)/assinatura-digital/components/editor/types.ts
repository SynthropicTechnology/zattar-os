/**
 * Editor Types
 *
 * Types specific to the FieldMappingEditor component and its sub-components.
 * These are UI-specific types that extend the domain types.
 */

import type { TemplateCampo, PosicaoCampo } from '@/shared/assinatura-digital/types/template.types';

/**
 * Signatário (Signer) interface for document signature assignment
 */
export interface Signatario {
  id: string;
  nome: string;
  email: string;
  cor: string; // Hex color for visual identification
  ordem: number;
}

/**
 * Default colors for signers - follows Zattar brand guidelines
 */
export const SIGNER_COLORS = [
  '#7C3AED', // Zattar Purple (primary)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Action Orange
  '#EC4899', // Pink
] as const;

/**
 * Field types available in the signature editor palette
 */
export type SignatureFieldType = 'signature' | 'initials' | 'date' | 'textbox';

/**
 * EditorField extends TemplateCampo with editor-specific state
 * Used internally by the FieldMappingEditor for tracking UI state
 */
export interface EditorField extends Omit<TemplateCampo, 'posicao'> {
  posicao: PosicaoCampo;
  isSelected: boolean;
  isDragging: boolean;
  justAdded?: boolean;
  template_id?: string;
  criado_em?: Date;
  atualizado_em?: Date;
  signatario_id?: string; // ID of the signer assigned to this field
}

/**
 * Editor mode for field creation
 */
export type EditorMode = 'select' | 'add_text' | 'add_image' | 'add_rich_text';

/**
 * Drag state for field movement and resizing
 */
export interface DragState {
  isDragging: boolean;
  fieldId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  hasMoved: boolean;
  mode: 'move' | 'resize';
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
  startWidth: number;
  startHeight: number;
}

/**
 * Resize handle positions
 */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

/**
 * API response type for preview test endpoint
 */
export type ApiPreviewTestResponse =
  | { success: true; arquivo_url: string; arquivo_nome?: string; avisos?: string[] }
  | { success: false; error: string };

/**
 * Canvas size configuration
 */
export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Toolbar position for draggable floating toolbar
 */
export interface ToolbarPosition {
  x: number;
  y: number;
}
