/**
 * BrandMark — Logo Zattar reutilizável.
 * ============================================================================
 * Componente único que cobre os ~6 padrões de uso da logomarca espalhados pelo
 * codebase (auth, sidebar, portal, header público, assinatura digital).
 *
 * Variantes:
 *   - `auto` (default): swap automático entre logomarca-light/dark via classes
 *      `dark:hidden` / `hidden dark:block`. Use em superfícies que respeitam
 *      o tema do usuário (header público, página de auth interna).
 *   - `light`: força a versão clara (uso em superfícies escuras).
 *   - `dark`: força a versão escura (uso em superfícies claras OU dentro
 *      de containers `.dark` como portal de cliente e sidebars).
 *
 * Sizing — duas estratégias:
 *   1. Pré-definidos via prop `size`: 'sm' | 'md' | 'lg' | 'xl'.
 *      Aplica `h-X w-auto` no <Image>, deixando a largura seguir aspect ratio.
 *   2. Custom via `size="custom"` + `className`: para casos responsive
 *      complexos (header com 3 breakpoints, sidebar com h-auto w-full, etc.).
 *
 * `collapsible`: em sidebars com `data-collapsible=icon`, o logo completo é
 * substituído pelo Z menor automaticamente.
 *
 * USO:
 *   <BrandMark variant="dark" size="lg" priority />
 *   <BrandMark href="/" size="md" />
 *   <BrandMark collapsible variant="dark" size="custom" className="w-full" />
 * ============================================================================
 */

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type BrandMarkVariant = 'auto' | 'light' | 'dark'
type BrandMarkSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom'

interface BrandMarkProps {
  variant?: BrandMarkVariant
  size?: BrandMarkSize
  /** Envolve em <Link href> — comum em headers */
  href?: string
  /** Mostra o logo Z pequeno quando o sidebar está colapsado */
  collapsible?: boolean
  /** Passa para next/image — true em above-the-fold */
  priority?: boolean
  /** Classe extra aplicada ao <Image> (não ao wrapper) */
  className?: string
  /** Override do alt — default "Zattar Advogados" */
  alt?: string
}

// Aspect ratio nativo da logomarca: 500x200 (5:2)
const INTRINSIC_WIDTH = 500
const INTRINSIC_HEIGHT = 200

const SIZE_CLASSES: Record<Exclude<BrandMarkSize, 'custom'>, string> = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-16 w-auto',
  xl: 'h-20 sm:h-24 w-auto',
}

const LIGHT_SRC = '/logos/Sem%20Fundo%20SVG/logo-zattar-light.svg'
const DARK_SRC = '/logos/Sem%20Fundo%20SVG/logo-zattar-dark.svg'
const SMALL_DARK_SRC = '/logos/Sem%20Fundo%20SVG/logo-z-dark.svg'

export function BrandMark({
  variant = 'auto',
  size = 'md',
  href,
  collapsible = false,
  priority = false,
  className,
  alt = 'Zattar Advogados',
}: BrandMarkProps) {
  const sizeClass = size === 'custom' ? '' : SIZE_CLASSES[size]
  const imageClass = cn(
    'object-contain',
    sizeClass,
    collapsible && 'group-data-[collapsible=icon]:hidden',
    className,
  )

  const content = (
    <>
      {variant === 'auto' && (
        <>
          <Image
            src={LIGHT_SRC}
            alt={alt}
            width={INTRINSIC_WIDTH}
            height={INTRINSIC_HEIGHT}
            priority={priority}
            className={cn(imageClass, 'dark:hidden')}
          />
          <Image
            src={DARK_SRC}
            alt={alt}
            width={INTRINSIC_WIDTH}
            height={INTRINSIC_HEIGHT}
            priority={priority}
            className={cn(imageClass, 'hidden dark:block')}
          />
        </>
      )}

      {variant === 'light' && (
        <Image
          src={LIGHT_SRC}
          alt={alt}
          width={INTRINSIC_WIDTH}
          height={INTRINSIC_HEIGHT}
          priority={priority}
          className={imageClass}
        />
      )}

      {variant === 'dark' && (
        <Image
          src={DARK_SRC}
          alt={alt}
          width={INTRINSIC_WIDTH}
          height={INTRINSIC_HEIGHT}
          priority={priority}
          className={imageClass}
        />
      )}

      {collapsible && (
        <Image
          src={SMALL_DARK_SRC}
          alt="Z"
          width={40}
          height={40}
          priority={priority}
          className="hidden h-10 w-10 object-contain group-data-[collapsible=icon]:block"
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label={alt}>
        {content}
      </Link>
    )
  }

  return content
}
