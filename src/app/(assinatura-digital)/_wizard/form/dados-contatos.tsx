'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'

import {
  contatosSchema,
  type ContatosFormData,
} from '@/shared/assinatura-digital/validations/dados-pessoais-sub.schemas'
import { InputTelefone } from '@/components/ui/input-telefone'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import { formatTelefone } from '@/shared/assinatura-digital/utils/formatters'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import FormStepLayout from './form-step-layout'

export default function DadosContatos() {
  const {
    dadosCPF,
    dadosPessoaisDraft,
    mergeDadosPessoaisDraft,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore()

  const clienteExistente = dadosCPF?.clienteExistente ?? false

  const defaultValues: ContatosFormData = useMemo(() => {
    const cliente = dadosCPF?.dadosCliente
    return {
      email: dadosPessoaisDraft?.email ?? cliente?.email ?? '',
      celular: formatTelefone(
        dadosPessoaisDraft?.celular ?? cliente?.celular ?? '',
      ),
      telefone: cliente?.telefone
        ? formatTelefone(dadosPessoaisDraft?.telefone ?? cliente.telefone)
        : dadosPessoaisDraft?.telefone
          ? formatTelefone(dadosPessoaisDraft.telefone)
          : '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<ContatosFormData>({
    resolver: zodResolver(contatosSchema),
    mode: 'onChange',
    defaultValues,
  })

  const watched = form.watch()
  const isValid = contatosSchema.safeParse(watched).success

  useEffect(() => {
    if (clienteExistente) {
      form.trigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteExistente])

  const onSubmit = (data: ContatosFormData) => {
    mergeDadosPessoaisDraft(data)
    proximaEtapa()
  }

  return (
    <FormStepLayout
      title={clienteExistente ? 'Confirme seus contatos' : 'Contatos'}
      description={
        clienteExistente
          ? 'Revise seus contatos e continue. Edite se necessário.'
          : 'Como podemos entrar em contato'
      }
      onPrevious={etapaAnterior}
      nextLabel={clienteExistente ? 'Confirmar e continuar' : 'Continuar'}
      isNextDisabled={!isValid}
      formId="contatos-form"
    >
      <Form {...form}>
        <form
          id="contatos-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {clienteExistente && (
            <div className="flex">
              <span className="inline-flex items-center rounded-full border border-info/20 bg-info/10 px-3 py-1 text-xs font-medium text-info">
                Dados importados
              </span>
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  E-mail
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="seu@email.com"
                    className="glass-field"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Celular
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </FormLabel>
                  <FormControl>
                    <InputTelefone
                      mode="cell"
                      placeholder="(00) 00000-0000"
                      className="glass-field"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <InputTelefone
                      mode="landline"
                      placeholder="(00) 0000-0000"
                      className="glass-field"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
            Submit
          </button>
        </form>
      </Form>
    </FormStepLayout>
  )
}
