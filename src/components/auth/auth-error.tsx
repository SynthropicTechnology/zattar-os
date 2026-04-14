'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { AUTH_STYLES } from './styles'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function AuthError({ error }: { error?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-8"
      >
        <ShieldAlert className="h-8 w-8" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease }}
        className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-foreground mb-3"
      >
        Erro de autenticação
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ease }}
        className="text-sm text-muted-foreground mb-10 max-w-xs leading-relaxed"
      >
        {error || 'Ocorreu um problema inesperado durante o processo de login. Por favor, tente novamente.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease }}
        className="w-full"
      >
        <Link href="/login" className={AUTH_STYLES.btnPrimary}>
          <ArrowLeft className="h-4.5 w-4.5" />
          Voltar ao login
        </Link>
      </motion.div>
    </div>
  )
}
