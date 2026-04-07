'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

const pageVariants = {
  enter: { opacity: 0, x: 12 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
}

// ─── Password Strength ───────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
  ]
  const passed = criteria.filter((c) => c.met).length
  const _pct = (passed / 4) * 100

  if (!password) return null

  const color =
    passed <= 1
      ? 'bg-destructive'
      : passed <= 2
        ? 'bg-warning'
        : 'bg-success'

  return (
    <div className="space-y-2 pt-1.5">
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

// ─── Password Toggle ─────────────────────────────────────────────────────────

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/40 transition-colors hover:text-muted-foreground"
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UpdatePasswordFormV2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        router.push('/app/dashboard')
      }, 2500)
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao atualizar a senha.'
      )
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
                Tudo certo.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sua nova senha foi definida com sucesso.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-success/15 bg-success/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Senha atualizada
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Você será redirecionado em instantes.
                </p>
              </div>
            </div>

            <div className="h-0.5 w-full rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-success/50"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            </div>

            <div className="text-center">
              <Link
                href="/app/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Ir para o login
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
                Senha nova.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Defina sua nova senha abaixo
              </p>
            </div>

            <form
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-5"
            >
              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordToggle
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    required
                    className={cn('pr-10', mismatch && 'border-destructive')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordToggle
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  />
                </div>
                <AnimatePresence>
                  {mismatch && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-destructive"
                    >
                      As senhas não coincidem
                    </motion.p>
                  )}
                </AnimatePresence>
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
                    Salvando...
                  </>
                ) : (
                  <>
                    Salvar nova senha
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
