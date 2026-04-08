/**
 * Property-Based Test: Cobertura completa de variantes de badge
 *
 * **Validates: Requirements 2.5, 3.4, 4.2, 8.5**
 *
 * Property 1: Para qualquer categoria registrada e qualquer valor válido
 * do domínio, `getSemanticBadgeVariant(categoria, valor)` retorna variante
 * diferente de 'neutral'.
 */
import fc from 'fast-check';
import {
  getSemanticBadgeVariant,
  TRIBUNAL_VARIANTS,
  STATUS_VARIANTS,
  GRAU_VARIANTS,
  PARTE_TIPO_VARIANTS,
  POLO_VARIANTS,
  AUDIENCIA_STATUS_VARIANTS,
  AUDIENCIA_MODALIDADE_VARIANTS,
  CAPTURA_STATUS_VARIANTS,
  TIPO_CONTRATO_VARIANTS,
  TIPO_COBRANCA_VARIANTS,
  STATUS_CONTRATO_VARIANTS,
  FOLHA_STATUS_VARIANTS,
  SALARIO_STATUS_VARIANTS,
  CALL_STATUS_VARIANTS,
  NETWORK_QUALITY_VARIANTS,
  ONLINE_STATUS_VARIANTS,
  OBRIGACAO_STATUS_VARIANTS,
  OBRIGACAO_TIPO_VARIANTS,
  OBRIGACAO_DIRECAO_VARIANTS,
  TEMPLATE_STATUS_VARIANTS,
  ATIVO_STATUS_VARIANTS,
  EXPEDIENTE_STATUS_VARIANTS,
  DOCUMENT_SIGNATURE_STATUS_VARIANTS,
  PROJECT_STATUS_VARIANTS,
  TASK_STATUS_VARIANTS,
  PRIORITY_VARIANTS,
  PAYMENT_STATUS_VARIANTS,
  FINANCIAL_ALERT_VARIANTS,
  ERROR_TYPE_VARIANTS,
} from '../variants';
import type { BadgeCategory, BadgeVisualVariant } from '../variants';

// ---------------------------------------------------------------------------
// Helper: build (category, value) pairs from a variant Record, excluding
// entries whose registered variant is 'neutral' (those are intentionally
// neutral and not a fallback).
// ---------------------------------------------------------------------------

type CategoryValuePair = readonly [BadgeCategory, string];

function pairsFromRecord(
  category: BadgeCategory,
  record: Record<string, BadgeVisualVariant>,
): CategoryValuePair[] {
  return Object.entries(record)
    .filter(([, variant]) => variant !== 'neutral')
    .map(([key]) => [category, key] as const);
}

// Collect all non-neutral (category, value) pairs from every registered Record
const allPairs: CategoryValuePair[] = [
  ...pairsFromRecord('tribunal', TRIBUNAL_VARIANTS),
  ...pairsFromRecord('status', STATUS_VARIANTS),
  ...pairsFromRecord('grau', GRAU_VARIANTS),
  ...pairsFromRecord('parte', PARTE_TIPO_VARIANTS),
  ...pairsFromRecord('polo', POLO_VARIANTS),
  ...pairsFromRecord('audiencia_status', AUDIENCIA_STATUS_VARIANTS),
  ...pairsFromRecord('audiencia_modalidade', AUDIENCIA_MODALIDADE_VARIANTS),
  ...pairsFromRecord('captura_status', CAPTURA_STATUS_VARIANTS),
  ...pairsFromRecord('tipo_contrato', TIPO_CONTRATO_VARIANTS),
  ...pairsFromRecord('tipo_cobranca', TIPO_COBRANCA_VARIANTS),
  ...pairsFromRecord('status_contrato', STATUS_CONTRATO_VARIANTS),
  ...pairsFromRecord('folha_status', FOLHA_STATUS_VARIANTS),
  ...pairsFromRecord('salario_status', SALARIO_STATUS_VARIANTS),
  ...pairsFromRecord('call_status', CALL_STATUS_VARIANTS),
  ...pairsFromRecord('network_quality', NETWORK_QUALITY_VARIANTS),
  ...pairsFromRecord('online_status', ONLINE_STATUS_VARIANTS),
  ...pairsFromRecord('obrigacao_status', OBRIGACAO_STATUS_VARIANTS),
  ...pairsFromRecord('obrigacao_tipo', OBRIGACAO_TIPO_VARIANTS),
  ...pairsFromRecord('obrigacao_direcao', OBRIGACAO_DIRECAO_VARIANTS),
  ...pairsFromRecord('template_status', TEMPLATE_STATUS_VARIANTS),
  ...pairsFromRecord('ativo_status', ATIVO_STATUS_VARIANTS),
  ...pairsFromRecord('expediente_status', EXPEDIENTE_STATUS_VARIANTS),
  ...pairsFromRecord('document_signature_status', DOCUMENT_SIGNATURE_STATUS_VARIANTS),
  ...pairsFromRecord('project_status', PROJECT_STATUS_VARIANTS),
  ...pairsFromRecord('task_status', TASK_STATUS_VARIANTS),
  ...pairsFromRecord('priority', PRIORITY_VARIANTS),
  ...pairsFromRecord('payment_status', PAYMENT_STATUS_VARIANTS),
  ...pairsFromRecord('financial_alert', FINANCIAL_ALERT_VARIANTS),
  ...pairsFromRecord('error_type', ERROR_TYPE_VARIANTS),
];

// Build a fast-check arbitrary that picks uniformly from all registered pairs
const categoryValueArbitrary = fc.oneof(
  ...allPairs.map((pair) => fc.constant(pair)),
);

describe('Property 1: Cobertura completa de variantes de badge', () => {
  it('getSemanticBadgeVariant retorna variante !== "neutral" para todos os valores de domínio registrados (não-neutros)', () => {
    fc.assert(
      fc.property(categoryValueArbitrary, ([category, value]) => {
        const result = getSemanticBadgeVariant(category, value);
        expect(result).not.toBe('neutral');
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// All BadgeCategory values for Property 2
// ---------------------------------------------------------------------------

const ALL_BADGE_CATEGORIES: BadgeCategory[] = [
  'tribunal',
  'status',
  'grau',
  'parte',
  'audiencia_status',
  'audiencia_modalidade',
  'expediente_tipo',
  'captura_status',
  'polo',
  'tipo_contrato',
  'tipo_cobranca',
  'status_contrato',
  'folha_status',
  'salario_status',
  'call_status',
  'network_quality',
  'online_status',
  'obrigacao_status',
  'obrigacao_tipo',
  'obrigacao_direcao',
  'document_signature_status',
  'project_status',
  'task_status',
  'priority',
  'template_status',
  'ativo_status',
  'expediente_status',
  'payment_status',
  'financial_alert',
  'error_type',
];

const badgeCategoryArbitrary = fc.oneof(
  ...ALL_BADGE_CATEGORIES.map((cat) => fc.constant(cat)),
);

// Arbitrary that generates strings with case variations and whitespace
const fuzzyStringArbitrary = fc.oneof(
  // Random alphanumeric strings
  fc.stringOf(fc.oneof(fc.char(), fc.constant(' '), fc.constant('\t')), { minLength: 0, maxLength: 30 }),
  // Known domain values with random case/whitespace mutations
  fc.oneof(...allPairs.map(([, val]) => fc.constant(val))).chain((base) =>
    fc.tuple(
      fc.boolean(), // toUpperCase?
      fc.boolean(), // add leading space?
      fc.boolean(), // add trailing space?
    ).map(([upper, leadSpace, trailSpace]) => {
      let result = upper ? base.toUpperCase() : base.toLowerCase();
      if (leadSpace) result = '  ' + result;
      if (trailSpace) result = result + '  ';
      return result;
    }),
  ),
);

describe('Property 2: Idempotência da normalização de badge variant', () => {
  /**
   * **Validates: Requirements 8.5**
   *
   * Para qualquer categoria e valor de entrada (incluindo variações de case/espaçamento),
   * `getSemanticBadgeVariant(cat, val) === getSemanticBadgeVariant(cat, val)`
   */
  it('getSemanticBadgeVariant retorna o mesmo resultado quando chamada duas vezes com os mesmos inputs', () => {
    fc.assert(
      fc.property(badgeCategoryArbitrary, fuzzyStringArbitrary, (category, value) => {
        const first = getSemanticBadgeVariant(category, value);
        const second = getSemanticBadgeVariant(category, value);
        expect(first).toBe(second);
      }),
      { numRuns: 100 },
    );
  });
});
