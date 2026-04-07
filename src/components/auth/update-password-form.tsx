'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ]
  const passed = checks.filter(Boolean).length

  if (!password) return null

  return (
    <div className="flex gap-1.5 px-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            i <= passed
              ? passed <= 1
                ? 'bg-destructive'
                : passed <= 2
                  ? 'bg-warning'
                  : 'bg-success'
              : 'bg-on-surface-variant/10'
          )}
        />
      ))}
    </div>
  )
}

export function UpdatePasswordForm({
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
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a senha.')
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
              Tudo certo.
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant/60">
              Sua nova senha foi definida com sucesso.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-success/15 bg-success/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <p className="text-sm leading-relaxed text-on-surface-variant/60">
              Você será redirecionado em instantes.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/app/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant/30 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Ir para o login
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Heading */}
          <div className="mb-9 text-center">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Senha nova.
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant/60">
              Defina sua nova senha abaixo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Lock className="h-4 w-4 text-on-surface-variant/25" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha"
                  className="w-full rounded-xl border border-outline-variant/10 bg-on-surface/4 py-4 pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-on-surface-variant/20 transition-colors hover:text-on-surface-variant/50"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2">
                <PasswordStrength password={password} />
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <ShieldCheck className="h-4 w-4 text-on-surface-variant/25" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                className={cn(
                  'w-full rounded-xl border bg-on-surface/4 py-4 pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/25 focus:outline-none focus:ring-1 transition-all',
                  confirmPassword && confirmPassword !== password
                    ? 'border-destructive/30 focus:border-destructive/30 focus:ring-destructive/20'
                    : 'border-outline-variant/10 focus:border-primary/30 focus:ring-primary/30'
                )}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-on-surface-variant/20 transition-colors hover:text-on-surface-variant/50"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {confirmPassword && confirmPassword !== password && (
              <p className="px-1 text-xs text-destructive/70">As senhas não coincidem</p>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary-dim py-4 px-6 font-headline text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
