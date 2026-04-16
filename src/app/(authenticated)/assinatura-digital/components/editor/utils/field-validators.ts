/**
 * Field Validators
 *
 * Validation utilities for editor fields.
 * Re-exports validation functions from field-helpers for naming consistency.
 */

export {
  validateFieldHeight,
  validateFieldIds,
  estimateRichTextHeight,
} from './field-helpers';

// Additional validation utilities can be added here

/**
 * Validates if a field has all required properties
 */
export function isValidField(field: unknown): boolean {
  if (!field || typeof field !== 'object') return false;

  const f = field as Record<string, unknown>;

  return (
    typeof f.id === 'string' &&
    f.id.length > 0 &&
    typeof f.nome === 'string' &&
    typeof f.tipo === 'string' &&
    f.posicao !== null &&
    typeof f.posicao === 'object'
  );
}

/**
 * Validates if field position is within canvas bounds
 */
export function isFieldInBounds(
  field: { posicao: { x: number; y: number; width: number; height: number } },
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const { x, y, width, height } = field.posicao;

  return (
    x >= 0 && y >= 0 && x + width <= canvasWidth && y + height <= canvasHeight
  );
}

/**
 * Validates if a field type is valid
 */
export function isValidFieldType(
  tipo: string
): tipo is 'texto' | 'assinatura' | 'texto_composto' {
  return ['texto', 'assinatura', 'texto_composto'].includes(tipo);
}
