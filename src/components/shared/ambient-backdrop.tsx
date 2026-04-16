/**
 * AmbientBackdrop — Background atmosférico reutilizável.
 * ============================================================================
 * Compõe três camadas decorativas (radial blur superior + inferior, grid
 * pontilhado opcional e gradiente vertical) para criar profundidade em hero
 * sections, telas de auth e landings sem repetir markup.
 *
 * Usa exclusivamente tokens semânticos (--primary, --success) — nenhum valor
 * OKLCH cru.
 *
 * USO:
 *   <div className="relative">
 *     <AmbientBackdrop />
 *     <main className="relative z-10">...</main>
 *   </div>
 *
 *   // Variante celebratória (sucesso)
 *   <AmbientBackdrop tint="success" />
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
  /** Tonalidade dos blobs. Default: 'primary' */
  tint?: 'primary' | 'success'
  className?: string
}

export function AmbientBackdrop({
  grid = true,
  baseGradient = true,
  blurIntensity = 20,
  tint = 'primary',
  className,
}: AmbientBackdropProps) {
  const opacity = Math.max(0, Math.min(100, blurIntensity)) / 100
  const blobClass = tint === 'success' ? 'bg-success' : 'bg-primary'
  const baseGradientClass =
    tint === 'success' ? 'from-success/5' : 'from-primary/5'
  const gridColor =
    tint === 'success' ? 'var(--color-success)' : 'var(--color-primary)'

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
          className={cn(
            'absolute -top-[20%] -left-[10%] h-125 w-125 rounded-full blur-[120px]',
            blobClass,
          )}
          style={{ opacity: opacity * 0.2 }}
        />
        <div
          className={cn(
            'absolute -bottom-[20%] -right-[10%] h-150 w-150 rounded-full blur-[120px]',
            blobClass,
          )}
          style={{ opacity: opacity * 0.1 }}
        />
        {grid && (
          <div
            className="absolute inset-0 bg-size-[40px_40px] opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(${gridColor} 1px, transparent 1px)`,
            }}
          />
        )}
      </div>
      {baseGradient && (
        <div
          aria-hidden="true"
          className={cn(
            'fixed bottom-0 left-0 h-1/3 w-full bg-linear-to-t to-transparent pointer-events-none',
            baseGradientClass,
          )}
        />
      )}
    </>
  )
}
