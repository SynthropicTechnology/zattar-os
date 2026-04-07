'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

const pageVariants = {
  enter: { opacity: 0, x: 12 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
}

export function ForgotPasswordFormV2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="relative h-10 w-10">
          <Image
            src="/logos/logo-small-dark.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
          Zattar Advogados
        </span>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                Pronto.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Se o email estiver cadastrado, você receberá um link para
                redefinir sua senha.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-success/15 bg-success/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/10">
                <Mail className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Email enviado
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                Sem problemas.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Digite seu email e enviamos um link para redefinir.
              </p>
            </div>

            <form
              onSubmit={handleForgotPassword}
              className="flex flex-col gap-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@zattar.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 rounded-md border border-destructive/15 bg-destructive/5 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full mt-1 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
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
