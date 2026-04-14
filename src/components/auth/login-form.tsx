'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowRight, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AUTH_STYLES } from './styles'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'Bom dia!'
  if (hour >= 12 && hour < 18) return 'Boa tarde!'
  return 'Boa noite!'
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (
          signInError.message?.includes('Database error querying schema') ||
          signInError.message?.includes('email_change')
        ) {
          console.error('Erro conhecido do Supabase Auth relacionado a email_change.')
        }
        throw signInError
      }

      if (!data.user) throw new Error('Falha na autenticação: usuário não retornado')

      setSuccess(true)
      setTimeout(() => router.push('/app/dashboard'), 700)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (err.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login')
        } else if (err.message.includes('500') || err.message.includes('Database error')) {
          setError('Erro no servidor de autenticação. Tente novamente mais tarde.')
        } else if (err.message.includes('email_change')) {
          setError('Erro interno de autenticação. Entre em contato com o suporte.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col items-center', className)} {...props}>
      {/* Greeting */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-foreground"
        >
          {getGreeting()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mt-2 text-sm text-muted-foreground"
        >
          Entre com suas credenciais para continuar
        </motion.p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ease }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease }}
        >
          <label htmlFor="password" className={AUTH_STYLES.label}>Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(AUTH_STYLES.input, 'pr-12')}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={AUTH_STYLES.toggle}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-xs text-muted-foreground/50 hover:text-primary transition-colors">
            Esqueci minha senha
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease }}
              className={AUTH_STYLES.error}
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease }}
        >
          <button
            type="submit"
            disabled={isLoading || success}
            className={cn(AUTH_STYLES.btnPrimary, success && AUTH_STYLES.btnSuccess)}
          >
            {success ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  )
}
