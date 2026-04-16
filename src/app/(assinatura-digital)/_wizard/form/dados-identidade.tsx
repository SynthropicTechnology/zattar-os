'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'

import {
  identidadeSchema,
  type IdentidadeFormData,
} from '@/shared/assinatura-digital/validations/dados-pessoais-sub.schemas'
import InputCPF from '@/shared/assinatura-digital/components/inputs/input-cpf'
import InputData from '@/shared/assinatura-digital/components/inputs/input-data'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import { formatCPF, formatData } from '@/shared/assinatura-digital/utils/formatters'
import { ESTADOS_CIVIS, GENEROS, NACIONALIDADES } from '@/shared/assinatura-digital/constants'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import FormStepLayout from './form-step-layout'

export default function DadosIdentidade() {
  const {
    dadosCPF,
    dadosPessoaisDraft,
    mergeDadosPessoaisDraft,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore()

  const clienteExistente = dadosCPF?.clienteExistente ?? false

  const defaultValues: IdentidadeFormData = useMemo(() => {
    const cliente = dadosCPF?.dadosCliente
    return {
      name: dadosPessoaisDraft?.name ?? cliente?.nome ?? '',
      cpf: formatCPF(
        dadosPessoaisDraft?.cpf ?? cliente?.cpf ?? dadosCPF?.cpf ?? '',
      ),
      rg: dadosPessoaisDraft?.rg ?? cliente?.rg ?? '',
      dataNascimento:
        dadosPessoaisDraft?.dataNascimento ??
        formatData(cliente?.data_nascimento ?? ''),
      genero: dadosPessoaisDraft?.genero ?? cliente?.genero ?? '1',
      nacionalidade:
        dadosPessoaisDraft?.nacionalidade ?? cliente?.nacionalidade ?? '30',
      estadoCivil:
        dadosPessoaisDraft?.estadoCivil ?? cliente?.estado_civil ?? '1',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<IdentidadeFormData>({
    resolver: zodResolver(identidadeSchema),
    mode: 'onChange',
    defaultValues,
  })

  const watched = form.watch()
  const isValid = identidadeSchema.safeParse(watched).success

  // Prefill quando cliente existente e o form ainda está vazio.
  useEffect(() => {
    if (clienteExistente) {
      form.trigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteExistente])

  const onSubmit = (data: IdentidadeFormData) => {
    mergeDadosPessoaisDraft(data)
    proximaEtapa()
  }

  return (
    <FormStepLayout
      title={clienteExistente ? 'Confirme sua identidade' : 'Identidade'}
      description={
        clienteExistente
          ? 'Revise seus dados e continue. Edite se necessário.'
          : 'Preencha seus dados para iniciar o cadastro'
      }
      onPrevious={etapaAnterior}
      nextLabel={clienteExistente ? 'Confirmar e continuar' : 'Continuar'}
      isNextDisabled={!isValid}
      formId="identidade-form"
    >
      <Form {...form}>
        <form
          id="identidade-form"
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite seu nome completo"
                    className="h-12"
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
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <InputCPF
                      placeholder="000.000.000-00"
                      disabled
                      className="h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite seu RG"
                      className="h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Data de Nascimento
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </FormLabel>
                <FormControl>
                  <InputData
                    placeholder="dd/mm/aaaa"
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="genero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(GENEROS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nacionalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">Brasileira</SelectItem>
                      {Object.entries(NACIONALIDADES)
                        .filter(([key]) => key !== '30')
                        .sort((a, b) => a[1].localeCompare(b[1]))
                        .map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estadoCivil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ESTADOS_CIVIS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
