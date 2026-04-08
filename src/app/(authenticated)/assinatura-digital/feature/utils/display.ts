/**
 * ASSINATURA DIGITAL - Display Utilities
 *
 * Funções utilitárias para formatação e exibição de dados
 * em componentes de UI (tabelas, badges, cards, etc.)
 */

import type { Segmento, Template, Formulario, StatusTemplate } from '../types';

// ============================================================================
// Template Utils
// ============================================================================

/**
 * Formata o tamanho de um arquivo em bytes para uma representação legível
 *
 * @param bytes - Tamanho do arquivo em bytes
 * @returns String formatada (ex: "1.50 MB", "350.00 KB")
 *
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1572864) // "1.50 MB"
 * formatFileSize(0) // "0 B"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Converte o status do template para uma label em português
 *
 * @param status - Status do template
 * @returns Label em português
 *
 * @example
 * formatTemplateStatus('ativo') // "Ativo"
 * formatTemplateStatus('rascunho') // "Rascunho"
 */
export function formatTemplateStatus(status: StatusTemplate): string {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'inativo':
      return 'Inativo';
    case 'rascunho':
      return 'Rascunho';
    default:
      return status;
  }
}

/**
 * Retorna o nome de exibição do template com fallbacks apropriados
 *
 * @param template - Objeto do template
 * @returns Nome de exibição do template
 *
 * @example
 * getTemplateDisplayName({ nome: 'Contrato de Prestação' }) // "Contrato de Prestação"
 * getTemplateDisplayName({ nome: '' }) // "Template sem nome"
 */
export function getTemplateDisplayName(template: Pick<Template, 'nome'>): string {
  return template.nome?.trim() || 'Template sem nome';
}

// ============================================================================
// Segmento Utils
// ============================================================================

/**
 * Returns the display name for a segmento, falling back to slug or 'Sem nome' if nome is not available.
 *
 * @param segmento - The segmento object
 * @returns The display name string
 *
 * @example
 * getSegmentoDisplayName({ nome: 'Jurídico', slug: 'juridico' }) // 'Jurídico'
 * getSegmentoDisplayName({ nome: '', slug: 'juridico' }) // 'juridico'
 */
export function getSegmentoDisplayName(segmento: Pick<Segmento, 'nome' | 'slug'>): string {
  return segmento.nome || segmento.slug || 'Sem nome';
}

// ============================================================================
// Formulario Utils
// ============================================================================

/**
 * Returns the display name for a formulario, falling back to a default if nome is not available.
 */
export function getFormularioDisplayName(formulario: Pick<Formulario, 'id' | 'nome'>): string {
  return formulario.nome || `Formulário #${formulario.id}`;
}

/**
 * Generates a preview text for selected templates.
 * Shows up to 3 template names, then "e mais X" if more.
 */
export function getTemplatePreviewText(
  templateIds: string[],
  templates: Pick<Template, 'template_uuid' | 'nome'>[]
): string {
  const selectedTemplates = templates.filter((t) => templateIds.includes(t.template_uuid));
  const names = selectedTemplates.map((t) => t.nome);
  if (names.length === 0) {
    return 'Nenhum template selecionado';
  }
  if (names.length <= 3) {
    return names.join(', ');
  }
  const firstThree = names.slice(0, 3).join(', ');
  const moreCount = names.length - 3;
  return `${firstThree} e mais ${moreCount}`;
}

// ============================================================================
// Generic Badge Utils
// ============================================================================

/**
 * Trunca um texto se ele exceder o comprimento máximo, adicionando "..."
 *
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo permitido
 * @returns Texto truncado ou original se menor que maxLength
 *
 * @example
 * truncateText('Nome muito longo do template', 20) // "Nome muito longo..."
 * truncateText('Curto', 20) // "Curto"
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formats the ativo status for display in a badge.
 *
 * @param ativo - Boolean indicating if the item is active
 * @returns 'Ativo' if true, 'Inativo' if false
 */
export function formatAtivoBadge(ativo: boolean): string {
  return ativo ? 'Ativo' : 'Inativo';
}

/**
 * Alias for formatAtivoBadge - for consistency with formularios page
 */
export const formatAtivoStatus = formatAtivoBadge;

/**
 * Returns the badge tone for the ativo status.
 * Use with <Badge tone={...}> instead of variant.
 */
export function getAtivoBadgeTone(ativo: boolean): 'success' | 'neutral' {
  return ativo ? 'success' : 'neutral';
}

/**
 * Formats a boolean value for display in a badge.
 */
export function formatBooleanBadge(value: boolean): string {
  return value ? 'Sim' : 'Não';
}
