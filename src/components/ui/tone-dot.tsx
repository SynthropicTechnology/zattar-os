/**
 * ToneDot — Dot colorido para legends e indicadores.
 * ============================================================================
 * Primitivo reutilizável para o padrão "bolinha colorida que representa um
 * item de legend". Extraído após ~22 ocorrências iguais em widgets do
 * dashboard e portal.
 *
 * Por quê existe:
 *   O padrão `<span className="size-2 rounded-full" style={{ backgroundColor:
 *   tokenForTone(item.tone) }} />` aparecia em 11 widgets, cada um com sua
 *   própria variação sutil (size-2, size-2.5, rounded-full, rounded-[3px],
 *   shrink-0). Consolidar num primitivo elimina a duplicação E a deriva
 *   visual entre widgets.
 *
 * 4 shapes cobrem todos os casos encontrados:
 *   - "dot" (default) — size-2 rounded-full (legend padrão)
 *   - "square" — size-2.5 rounded-[3px] (donut legend quadrado)
 *   - "pill" — w-4 h-1.5 rounded-full (barra horizontal compacta)
 *   - "bullet" — size-2 rounded-sm (stacked bar legend)
 *
 * 3 sizes (sm/md/lg) ajustam o tamanho proporcionalmente.
 *
 * USO:
 *   import { ToneDot } from '@/components/ui/tone-dot'
 *
 *   <ToneDot tone={item.tone} />
 *   <ToneDot tone="success" shape="square" size="md" />
 *   <ToneDot tone={item.tone} className="mr-1.5" />
 *
 * Alternativamente, pode receber uma cor custom via `color` (string CSS)
 * para casos onde `tone` não existe (ex: fallback legacy, dado do banco).
 * ============================================================================
 */

import { type SemanticTone, tokenForTone } from '@/lib/design-system'
import { cn } from '@/lib/utils'

type ToneDotShape = 'dot' | 'square' | 'pill' | 'bullet'
type ToneDotSize = 'sm' | 'md' | 'lg'

interface ToneDotProps {
  /** Tom semântico — preferido quando disponível */
  tone?: SemanticTone
  /** Cor CSS direta — fallback para legacy ou cores customizadas (hex/var) */
  color?: string
  /** Formato do indicador */
  shape?: ToneDotShape
  /** Tamanho */
  size?: ToneDotSize
  /** Classes extras */
  className?: string
  /** Label acessível — default "indicator" */
  'aria-label'?: string
}

const SHAPE_CLASSES: Record<ToneDotShape, Record<ToneDotSize, string>> = {
  dot: {
    sm: 'size-1.5 rounded-full',
    md: 'size-2 rounded-full',
    lg: 'size-2.5 rounded-full',
  },
  square: {
    sm: 'size-2 rounded-[2px]',
    md: 'size-2.5 rounded-[3px]',
    lg: 'size-3 rounded-[4px]',
  },
  pill: {
    sm: 'w-3 h-1 rounded-full',
    md: 'w-4 h-1.5 rounded-full',
    lg: 'w-5 h-2 rounded-full',
  },
  bullet: {
    sm: 'size-1.5 rounded-sm',
    md: 'size-2 rounded-sm',
    lg: 'size-2.5 rounded-sm',
  },
}

export function ToneDot({
  tone,
  color,
  shape = 'dot',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'indicator',
}: ToneDotProps) {
  const bg = color ?? (tone ? tokenForTone(tone) : 'var(--muted-foreground)')

  return (
    <span
      role="presentation"
      aria-label={ariaLabel}
      className={cn('inline-block shrink-0', SHAPE_CLASSES[shape][size], className)}
      style={{ backgroundColor: bg }}
    />
  )
}

export type { ToneDotShape, ToneDotSize, ToneDotProps }
