'use client'

import { useState, useTransition } from 'react'
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react'
import { actionLoginPortal } from '../../actions/portal-actions'

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function CpfHeroForm() {
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!cpf || cpf.trim() === '') {
      setError('Por favor, insira seu CPF para acessar.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await actionLoginPortal(cpf)
      if (result && !result.success) {
        setError(result.error || 'Erro ao validar CPF')
      }
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-primary/10 bg-surface-container/70 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div
        className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-primary/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="mb-8 flex flex-col items-center gap-5 text-center">
        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface sm:text-[2rem]">
            Portal do Cliente
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-on-surface-variant">
            Consulte seus processos, documentos e atualizações em um ambiente seguro e direto.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="cpf"
            className="block text-[10px] tracking-widest uppercase text-on-surface-variant/80 ml-1 font-medium"
          >
            CPF
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Fingerprint className="h-4.5 w-4.5 text-on-surface-variant" />
            </div>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-white/5 bg-surface-container-high py-4 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline/30 transition-all focus:border-primary/20 focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              disabled={isPending}
              autoComplete="off"
              maxLength={14}
              aria-describedby={error ? 'portal-cpf-error' : 'portal-cpf-help'}
            />
          </div>
          <p id="portal-cpf-help" className="ml-1 text-xs leading-5 text-on-surface-variant/70">
            Digite o CPF cadastrado para consultar seus dados no portal.
          </p>
        </div>

        {error && (
          <div
            id="portal-cpf-error"
            className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-red-300"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-4 font-headline font-extrabold tracking-tight text-on-primary-fixed transition-all duration-300 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Acessar Portal
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
