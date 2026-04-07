/**
 * Design System Sinesys
 *
 * Sistema de Design Determinístico para aplicações AI-First.
 * Este módulo centraliza tokens, variantes e utilitários para garantir
 * consistência visual em todo o sistema.
 *
 * @ai-context Importe deste módulo para acessar tokens de design e mapeamentos semânticos.
 * Use getSemanticBadgeVariant() para determinar variantes visuais baseadas em domínio.
 *
 * @example
 * import { getSemanticBadgeVariant, TOKENS, FORMAT } from '@/lib/design-system';
 *
 * // Obter variante para um tribunal
 * const variant = getSemanticBadgeVariant('tribunal', 'TRT1'); // 'info'
 *
 * // Formatação de moeda
 * const valor = FORMAT.currency(1234.56); // "R$ 1.234,56"
 */

// Tokens fundamentais
export {
  SPACING,
  SPACING_CLASSES,
  SPACING_SEMANTIC,
  TYPOGRAPHY,
  TEXT_PATTERNS,
  OPACITY_SCALE,
  PAGE_LAYOUT,
  GLASS_DEPTH,
  GLASS_BASE,
  ICON_CONTAINER,
  AVATAR_SIZES,
  SHADOWS,
  RADIUS,
  BREAKPOINTS,
  TRANSITIONS,
  Z_INDEX,
  TOKENS,
  type TokensType,
} from './tokens';

// Variantes semânticas e mapeamentos
export {
  // Tipos
  type BadgeVisualVariant,
  type BadgeTone,
  type BadgeCategory,

  // Mapeamentos individuais
  TRIBUNAL_VARIANTS,
  STATUS_VARIANTS,
  GRAU_VARIANTS,
  PARTE_TIPO_VARIANTS,
  POLO_VARIANTS,
  AUDIENCIA_STATUS_VARIANTS,
  AUDIENCIA_MODALIDADE_VARIANTS,
  EXPEDIENTE_TIPO_VARIANTS,
  CAPTURA_STATUS_VARIANTS,
  COMUNICACAO_CNJ_VARIANTS,

  // Função principal
  getSemanticBadgeVariant,
  getSemanticBadgeTone,
  getExpedienteTipoVariant,

  // Labels
  PARTE_TIPO_LABELS,
  GRAU_LABELS,
  CAPTURA_STATUS_LABELS,
  getParteTipoLabel,

  // Exports agrupados
  VARIANTS,
  LABELS,
} from './variants';

// Event Colors (calendar/agenda)
export {
  type EventType,
  type LegacyEventColor,
  type EventColorClasses,
  getEventColorClasses,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from './event-colors';

// Semantic Tones (domain layer — no color carried)
export {
  type SemanticTone,
  tokenForTone,
  bgClassForTone,
  textClassForTone,
} from './semantic-tones';

// Utilitários
export {
  cn,

  // Formatação
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatCPF,
  formatCNPJ,
  formatDocument,
  formatPhone,
  formatProcessNumber,
  truncateText,
  toTitleCase,
  removeAccents,

  // Validação
  isValidCPF,
  isValidCNPJ,

  // Cálculos
  calculateAge,
  daysUntil,

  // Exports agrupados
  FORMAT,
  VALIDATE,
  CALC,
} from './utils';
