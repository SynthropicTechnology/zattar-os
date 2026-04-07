/**
 * no-hsl-var-tokens
 * ============================================================================
 * Bloqueia o padrão `hsl(var(--token))` em strings literais e template literals.
 *
 * MOTIVO (por que isto é um bug, não um lint cosmético):
 *
 *   O design system Sinesys define todos os tokens de cor em OKLCH no
 *   globals.css (--primary, --success, --background, etc.). Por exemplo:
 *
 *     --primary: oklch(0.48 0.26 281);
 *
 *   Quando alguém escreve `hsl(var(--primary))` em um className ou style,
 *   o CSS resultante é literalmente:
 *
 *     hsl(oklch(0.48 0.26 281))   ← INVÁLIDO
 *
 *   Esse valor é descartado pelo browser e a propriedade fica com fallback
 *   transparent ou herdada — gráficos renderizam invisíveis, badges somem,
 *   borders desaparecem.
 *
 * COMO CORRIGIR:
 *
 *   Em vez de:                          Use:
 *   --------------------------------    --------------------------------
 *   hsl(var(--primary))                 var(--primary)
 *   hsl(var(--success) / 0.5)           oklch(from var(--success) l c h / 0.5)
 *   hsl(var(--token, fallback))         var(--token, fallback)
 *
 * ESCOPO:
 *
 *   Severidade `error` — bloqueia o build via `npm run lint`. Isto é
 *   intencional: o padrão NÃO é estilo, é bug visual confirmado em produção.
 *
 *   Detecta os 3 padrões:
 *     1. Literal string  : 'hsl(var(--token))'
 *     2. Literal string  : "hsl(var(--token))"
 *     3. Template element : `hsl(var(--token))`
 * ============================================================================
 */

const HSL_VAR_PATTERN = /hsl\(\s*var\(\s*--/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bloqueia hsl(var(--token)) — globals.css usa OKLCH, hsl(oklch(...)) é CSS inválido',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      invalidCss:
        'Não use hsl(var(--token)). globals.css define tokens em OKLCH — hsl(oklch(...)) é CSS inválido. Use var(--token) direto, ou oklch(from var(--token) l c h / alpha) para opacidade.',
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (HSL_VAR_PATTERN.test(node.value)) {
          context.report({ node, messageId: 'invalidCss' });
        }
      },
      TemplateElement(node) {
        const raw = node.value && node.value.raw;
        if (typeof raw !== 'string') return;
        if (HSL_VAR_PATTERN.test(raw)) {
          context.report({ node, messageId: 'invalidCss' });
        }
      },
    };
  },
};
