/**
 * SEMANTIC TONES — Design System
 * ============================================================================
 * Tipos semânticos para representar "tom" de UI em camadas de domain/service
 * SEM carregar cor propriamente dita. UI layer resolve o tom para token CSS.
 *
 * Por quê existe:
 *   Repositories e services NÃO devem carregar cor. Cor é apresentação,
 *   domínio cuida de significado. Antes desta refatoração, repositories como
 *   dashboard/repositories/processos-metrics.ts retornavam `color: 'oklch(...)'`
 *   diretamente — acoplando domain layer ao design system.
 *
 *   Solução: repositories retornam `tone: SemanticTone`, UI chama
 *   `tokenForTone(tone)` e recebe `var(--success)` etc.
 *
 * Vantagens:
 *   1. Trocar paleta = mudar apenas o mapa aqui (1 lugar)
 *   2. Domain testável sem mock de design system
 *   3. Mesmo tom pode ter renderização diferente em contextos (chart vs badge)
 *   4. Respeita light/dark automaticamente (tokens fazem isso)
 *
 * USO:
 *   // Repository
 *   return { status: 'Ativos', count: 42, tone: 'success' };
 *
 *   // UI component
 *   import { tokenForTone } from '@/lib/design-system';
 *   <Cell fill={tokenForTone(item.tone)} />
 * ============================================================================
 */

/**
 * Tons semânticos canônicos. Ordem importa — do mais positivo ao mais negativo.
 */
export type SemanticTone =
  | 'success' // verde — positivo, concluído, saudável
  | 'info' // azul — informação, neutro positivo
  | 'primary' // roxo brand — destaque principal
  | 'accent' // complementar — destaque secundário
  | 'warning' // âmbar — atenção, pendente
  | 'destructive' // vermelho — erro, perigo, crítico
  | 'neutral' // cinza — muted, inativo, arquivado
  | 'chart-1' // paleta categórica — sem significado inherente
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'

/**
 * Converte um tom semântico para CSS variable utilizável em:
 *   - inline style: style={{ backgroundColor: tokenForTone('success') }}
 *   - SVG prop: <Cell fill={tokenForTone('warning')} />
 *   - Chart libs: { color: tokenForTone('info') }
 *
 * Retorna sempre `var(--token)` — tokens OKLCH do globals.css.
 */
export function tokenForTone(tone: SemanticTone): string {
  return TONE_TO_CSS_VAR[tone]
}

/**
 * Retorna classe Tailwind para background baseado em tom.
 * Usa utilities pre-geradas via @theme inline (bg-success, bg-primary, etc.).
 */
export function bgClassForTone(tone: SemanticTone): string {
  return TONE_TO_BG_CLASS[tone]
}

/**
 * Retorna classe Tailwind para text color baseado em tom.
 */
export function textClassForTone(tone: SemanticTone): string {
  return TONE_TO_TEXT_CLASS[tone]
}

const TONE_TO_CSS_VAR: Record<SemanticTone, string> = {
  success: 'var(--success)',
  info: 'var(--info)',
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  neutral: 'var(--muted-foreground)',
  'chart-1': 'var(--chart-1)',
  'chart-2': 'var(--chart-2)',
  'chart-3': 'var(--chart-3)',
  'chart-4': 'var(--chart-4)',
  'chart-5': 'var(--chart-5)',
}

const TONE_TO_BG_CLASS: Record<SemanticTone, string> = {
  success: 'bg-success',
  info: 'bg-info',
  primary: 'bg-primary',
  accent: 'bg-accent',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  neutral: 'bg-muted-foreground',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

const TONE_TO_TEXT_CLASS: Record<SemanticTone, string> = {
  success: 'text-success',
  info: 'text-info',
  primary: 'text-primary',
  accent: 'text-accent-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
  neutral: 'text-muted-foreground',
  'chart-1': 'text-chart-1',
  'chart-2': 'text-chart-2',
  'chart-3': 'text-chart-3',
  'chart-4': 'text-chart-4',
  'chart-5': 'text-chart-5',
}
