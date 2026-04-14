'use client'

/**
 * Auth Layout — Cinematic Runway + Glass Card
 *
 * Dark background com canvas-dots, spotlights e noise.
 * Form envolto por glass card. Logo Z fixa no topo.
 */

import Image from 'next/image'

const Z_DARK = '/logos/Sem%20Fundo%20SVG/logo-z-dark.svg'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark auth-runway relative min-h-svh flex items-center justify-center overflow-hidden canvas-dots">
      {/* Noise texture */}
      <div className="auth-noise" aria-hidden="true" />

      {/* Spotlights */}
      <div className="auth-spotlight" aria-hidden="true" />
      <div className="auth-spotlight-warm" aria-hidden="true" />
      <div className="auth-edge-glow" aria-hidden="true" />

      {/* Fixed Z mark at top */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-20">
        <Image src={Z_DARK} alt="Z" width={40} height={40} priority className="h-10 w-10" />
      </div>

      {/* Glass card + content */}
      <main className="relative z-10 w-full max-w-110 px-4">
        <div className="glass-card rounded-3xl px-8 py-10 sm:px-10 sm:py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
