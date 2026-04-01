'use client'

/**
 * AuthError V2 — "Átrio de Vidro" (Light Mode)
 */

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'

export function AuthErrorV2({ error }: { error?: string }) {
  return (
    <div className="flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative h-11 w-11">
          <Image
            src="/logos/logo-small.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[3px] text-muted-foreground/40">
          Zattar Advogados
        </span>
      </div>

      <motion.div
        className="flex flex-col gap-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/6 border border-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive/60" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
            Algo deu errado.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-65 mx-auto">
            {error ||
              'Ocorreu um erro não especificado durante a autenticação.'}
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/app/login"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/40 bg-white/60 backdrop-blur-sm py-3 px-6 text-sm font-medium text-foreground/70 transition-all duration-300 hover:bg-white/80 hover:border-border/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </motion.div>
    </div>
  )
}
