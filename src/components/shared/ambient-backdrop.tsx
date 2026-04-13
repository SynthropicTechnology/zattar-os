/**
 * AmbientBackdrop — Background atmosférico reutilizável.
 * ============================================================================
 * Compõe três camadas decorativas (radial blur superior + inferior, grid
 * pontilhado opcional e gradiente vertical) para criar profundidade em hero
 * sections, telas de auth e landings sem repetir markup.
 *
 * Usa exclusivamente tokens semânticos (--primary) — nenhum valor OKLCH cru.
 *
 * USO:
 *   <div className="relative">
 *     <AmbientBackdrop />
 *     <main className="relative z-10">...</main>
 *   </div>
 * ============================================================================
 */

import { cn } from '@/lib/utils'

interface AmbientBackdropProps {
  /** Mostra grid de pontos sutil. Default: true */
  grid?: boolean
  /** Mostra gradiente vertical na base. Default: true */
  baseGradient?: boolean
  /** Intensidade dos blobs de blur (0-100). Default: 20 */
  blurIntensity?: number
  className?: string
}

export function AmbientBackdrop({
  grid = true,
  baseGradient = true,
  blurIntensity = 20,
  className,
}: AmbientBackdropProps) {
  const opacity = Math.max(0, Math.min(100, blurIntensity)) / 100

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 pointer-events-none overflow-hidden',
          className,
        )}
      >
        <div
          className="absolute -top-[20%] -left-[10%] h-125 w-125 rounded-full bg-primary blur-[120px]"
          style={{ opacity: opacity * 0.2 }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] h-150 w-150 rounded-full bg-primary blur-[120px]"
          style={{ opacity: opacity * 0.1 }}
        />
        {grid && (
          <div
            className="absolute inset-0 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[40px_40px] opacity-[0.03]"
          />
        )}
      </div>
      {baseGradient && (
        <div
          aria-hidden="true"
          className="fixed bottom-0 left-0 h-1/3 w-full bg-linear-to-t from-primary/5 to-transparent pointer-events-none"
        />
      )}
    </>
  )
}
