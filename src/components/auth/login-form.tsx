'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AtSign, AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia.'
  if (hour < 18) return 'Boa tarde.'
  return 'Boa noite.'
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (
          error.message?.includes('Database error querying schema') ||
          error.message?.includes('email_change')
        ) {
          console.error(
            'Erro conhecido do Supabase Auth relacionado a email_change.'
          )
        }
        throw error
      }

      if (!data.user) {
        throw new Error('Falha na autenticação: usuário não retornado')
      }

      router.push('/app/dashboard')
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login')
        } else if (
          error.message.includes('500') ||
          error.message.includes('Database error')
        ) {
          setError(
            'Erro no servidor de autenticação. Tente novamente mais tarde.'
          )
        } else if (error.message.includes('email_change')) {
          setError(
            'Erro interno de autenticação. Entre em contato com o suporte.'
          )
        } else {
          setError(error.message)
        }
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.')
      }
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

      {/* Greeting */}
      <div className="mb-9 text-center">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
          {getGreeting()}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant/60">
          Acesse sua estação de trabalho
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3">
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

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Lock className="h-4 w-4 text-on-surface-variant/25" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-outline-variant/10 bg-on-surface/4 py-4 pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-on-surface-variant/20 transition-colors hover:text-on-surface-variant/50"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
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
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <Link
          href="/app/forgot-password"
          className="text-xs text-on-surface-variant/30 transition-colors hover:text-primary"
        >
          Esqueci minha senha
        </Link>
      </div>
    </div>
  )
}
