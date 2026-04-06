'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AtSign, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

export function ForgotPasswordForm({
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
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="relative h-12 w-12">
          <Image
            src="/logos/logo-small-dark.svg"
            alt="Zattar Advogados"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[3px] text-on-surface-variant/25">
          Zattar Advogados
        </span>
      </div>

      {success ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Pronto.
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant/60 leading-relaxed">
              Se o email estiver cadastrado, você receberá<br />
              um link para redefinir sua senha.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm leading-relaxed text-on-surface-variant/60">
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/app/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant/30 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Heading */}
          <div className="mb-9 text-center">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Sem problemas.
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant/60 leading-relaxed">
              Digite seu email e enviamos<br />
              um link para redefinir.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <AtSign className="h-4 w-4 text-on-surface-variant/25" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="voce@zattar.com.br"
                className="w-full rounded-xl border border-outline-variant/10 bg-on-surface/4 py-4 pl-12 pr-4 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-brrom-primary to-primary-dim py-4 px-6 font-headline text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href="/app/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant/30 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar para o login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
