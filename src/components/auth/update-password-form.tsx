'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AUTH_STYLES } from './styles'

const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
  ]
  const passed = criteria.filter((c) => c.met).length

  if (!password) return null

  const color =
    passed <= 1 ? 'bg-destructive' : passed <= 2 ? 'bg-warning' : 'bg-success'

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= passed ? color : 'bg-border'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-300',
                c.met
                  ? 'bg-success/15 text-success'
                  : 'bg-muted text-muted-foreground/20'
              )}
            >
              {c.met && <Check className="h-2 w-2" strokeWidth={3} />}
            </div>
            <span
              className={cn(
                'text-[11px] transition-colors duration-300',
                c.met ? 'text-muted-foreground' : 'text-muted-foreground/40'
              )}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        router.push('/app/dashboard')
      }, 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar a senha.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
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
            <h1 className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-foreground mb-2">
              Tudo certo.
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Sua nova senha foi definida com sucesso.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-success/15 bg-success/5 p-4 mb-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground/80">Senha atualizada</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Você será redirecionado em instantes.
                </p>
              </div>
            </div>

            <div className="h-0.5 w-full rounded-full bg-border overflow-hidden mb-6">
              <motion.div
                className="h-full rounded-full bg-success/50"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Ir para o login
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
                Senha nova.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: customEase }}
                className="mt-2 text-sm text-muted-foreground"
              >
                Defina sua nova senha abaixo
              </motion.p>
            </div>

            <form onSubmit={handleUpdate} className="w-full space-y-5">
              <div>
                <label htmlFor="password" className={AUTH_STYLES.label}>Nova senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(AUTH_STYLES.input, 'pr-12')}
                    autoComplete="new-password"
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
                <PasswordStrength password={password} />
              </div>

              <div>
                <label htmlFor="confirm-password" className={AUTH_STYLES.label}>Confirmar senha</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(AUTH_STYLES.input, 'pr-12', mismatch && 'border-destructive')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={AUTH_STYLES.toggle}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {mismatch && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-destructive mt-1"
                    >
                      As senhas não coincidem
                    </motion.p>
                  )}
                </AnimatePresence>
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
                    Salvar nova senha
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
