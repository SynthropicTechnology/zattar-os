'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AUTH_STYLES } from './styles'

const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (resetError) throw resetError
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao enviar o e-mail.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: customEase }}
            className="text-center w-full"
          >
            <div className="text-center mb-8">
              <h1 className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-foreground">
                Pronto.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Se o email estiver cadastrado, você receberá um link.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-success/15 bg-success/5 p-4 mb-8">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <Mail className="h-4 w-4 text-success" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground/80">Email enviado</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar para o login
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: customEase }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: customEase }}
                className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-foreground"
              >
                Sem problemas.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: customEase }}
                className="mt-2 text-sm text-muted-foreground"
              >
                Digite seu email e enviamos um link para redefinir.
              </motion.p>
            </div>

            <form onSubmit={handleReset} className="w-full space-y-5">
              <div>
                <label htmlFor="email" className={AUTH_STYLES.label}>Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@zattar.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={AUTH_STYLES.input}
                  autoComplete="email"
                />
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: customEase }}
                    className={AUTH_STYLES.error}
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={isLoading} className={AUTH_STYLES.btnPrimary}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Enviar link
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
