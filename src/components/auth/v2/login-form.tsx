'use client'

/**
 * LoginForm V2 — Zero
 *
 * Usa os componentes reais do projeto: Input, Button, Label.
 * Mesma tipografia, espaçamento e tokens do app interno.
 * Sem custom inputs, sem font-mono, sem gimmicks.
 */

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Animation ───────────────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const

// ─── Login Form ──────────────────────────────────────────────────────────────

export function LoginFormV2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
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

      setSuccess(true)
      setTimeout(() => router.push('/app/dashboard'), 700)
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
          setError('Erro no servidor de autenticação. Tente novamente mais tarde.')
        } else if (error.message.includes('email_change')) {
          setError('Erro interno de autenticação. Entre em contato com o suporte.')
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
      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              required
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/40 transition-colors hover:text-muted-foreground"
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

        {/* Error */}
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

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || success}
          className={cn(
            'w-full mt-1 cursor-pointer',
            success && 'bg-success hover:bg-success'
          )}
        >
          {success ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : isLoading ? (
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
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <Link
          href="/app/forgot-password"
          className="text-xs text-muted-foreground/50 transition-colors hover:text-primary"
        >
          Esqueci minha senha
        </Link>
      </div>
    </div>
  )
}
