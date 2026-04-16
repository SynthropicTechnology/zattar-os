/**
 * ASSINATURA DIGITAL - Slug Helpers
 *
 * Utilitários para geração e validação de slugs para segmentos e formulários.
 * Formato: kebab-case (apenas lowercase a-z, números 0-9, e hífens como separadores)
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Regex pattern para validar formato de slug (kebab-case)
 *
 * Formato:
 * - Apenas lowercase (a-z)
 * - Números (0-9)
 * - Hífens (-) como separadores
 * - Não pode começar ou terminar com hífen
 *
 * @example
 * 'juridico' ✓
 * 'juridico-sp' ✓
 * 'rh-e-pessoas' ✓
 * 'Juridico' ✗ (uppercase)
 * 'juridico_sp' ✗ (underscore)
 * '-juridico' ✗ (começa com hífen)
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normaliza string removendo acentos e diacríticos
 *
 * @param str - String a ser normalizada
 * @returns String normalizada sem acentos
 *
 * @example
 * normalizeString('Jurídico') // 'Juridico'
 * normalizeString('São Paulo') // 'Sao Paulo'
 */
export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera slug a partir de um nome
 *
 * Processo:
 * 1. Normaliza string (remove acentos)
 * 2. Converte para lowercase
 * 3. Remove espaços em branco nas extremidades
 * 4. Substitui espaços por hífen
 * 5. Remove caracteres especiais
 * 6. Remove hífens duplicados
 * 7. Remove hífens do início/fim
 *
 * @param nome - Nome a ser convertido em slug
 * @returns Slug no formato kebab-case
 *
 * @example
 * generateSlug('Jurídico SP') // 'juridico-sp'
 * generateSlug('RH & Pessoas') // 'rh-pessoas'
 * generateSlug('Vendas - Região Sul') // 'vendas-regiao-sul'
 */
export function generateSlug(nome: string): string {
  return normalizeString(nome)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/[^a-z0-9-]/g, '') // Remove caracteres especiais
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
}

/**
 * Gera slug a partir do nome do formulário
 * Alias para generateSlug
 */
export const generateFormularioSlug = generateSlug;

/**
 * Valida formato de slug (kebab-case)
 *
 * @param slug - Slug a ser validado
 * @returns true se válido, false caso contrário
 *
 * @example
 * validateSlug('juridico') // true
 * validateSlug('juridico-sp') // true
 * validateSlug('Juridico') // false (uppercase)
 * validateSlug('') // false (vazio)
 */
export function validateSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
