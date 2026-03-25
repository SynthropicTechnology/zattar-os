'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AtSign, AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'

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
        console.error('Erro de autenticação:', error)
        if (
          error.message?.includes('Database error querying schema') ||
          error.message?.includes('email_change')
        ) {
          console.error(
            'Erro conhecido do Supabase Auth relacionado a email_change. ' +
              'Este é um bug interno do Supabase. Verifique os logs do Supabase para mais detalhes.'
          )
        }
        throw error
      }

      if (!data.user) {
        throw new Error('Falha na autenticação: usuário não retornado')
      }

      router.push('/app/dashboard')
    } catch (error: unknown) {
      console.error('Erro no login:', error)
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login')
        } else if (
          error.message.includes('500') ||
          error.message.includes('Database error querying schema') ||
          error.message.includes('Database error')
        ) {
          setError(
            'Erro no servidor de autenticação. Por favor, tente novamente mais tarde.'
          )
        } else if (error.message.includes('email_change')) {
          setError(
            'Erro interno de autenticação. Por favor, entre em contato com o suporte.'
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
      <div className="mb-10 flex flex-col items-center gap-4 lg:hidden">
        <div className="relative h-16 w-80">
            <Image
              src="/logos/logomarca-dark.svg"
              alt="Zattar Advogados"
              fill
              priority
              className="object-contain object-center"
            />
          </div>
        <span className="inline-flex rounded-full border border-outline-variant/30 bg-surface-container-highest/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
          Ambiente interno
        </span>
      </div>

      <div className="text-center lg:text-left mb-10">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
          Entrar no Zattar OS
        </h2>
        <p className="text-sm text-on-surface-variant">
          Acesse a plataforma interna com suas credenciais corporativas.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-[10px] uppercase tracking-widest text-primary font-bold"
          >
            E-mail corporativo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <AtSign className="h-4 w-4 text-outline" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="voce@zattar.com.br"
              className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all font-mono text-sm"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="sr-only"
          >
            E-mail corporativo
          </label>
          <label
            htmlFor="password"
            className="block text-[10px] uppercase tracking-widest text-primary font-bold"
          >
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-outline" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all font-mono text-sm"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-outline transition-colors hover:text-on-surface"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm leading-relaxed text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-container text-on-primary-fixed font-headline font-extrabold py-4 px-6 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col items-center gap-4 pt-8">
        <Link
          href="/app/forgot-password"
          className="text-[10px] text-outline uppercase tracking-widest hover:text-primary transition-colors"
        >
          Esqueci minha senha
        </Link>
        <div className="flex gap-4">
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
        </div>
      </div>
    </div>
  )
}
