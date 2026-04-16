'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { toast } from 'sonner'

import {
  enderecoSchema,
  type EnderecoFormData,
} from '@/shared/assinatura-digital/validations/dados-pessoais-sub.schemas'
import { dadosPessoaisSchema } from '@/shared/assinatura-digital/validations/dados-pessoais.schema'
import { InputCEP, type InputCepAddress } from '@/app/(authenticated)/enderecos'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import { apiFetch } from '@/lib/http/api-fetch'
import {
  parseCPF,
  parseTelefone,
  parseCEP,
} from '@/shared/assinatura-digital/utils/formatters'
import { API_ROUTES, ESTADOS_BRASILEIROS } from '@/shared/assinatura-digital/constants'
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

export default function DadosEndereco() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    dadosCPF,
    segmentoId,
    formularioId,
    dadosPessoaisDraft,
    mergeDadosPessoaisDraft,
    resetDadosPessoaisDraft,
    setDadosPessoais,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore()

  const clienteExistente = dadosCPF?.clienteExistente ?? false

  const defaultValues: EnderecoFormData = useMemo(() => {
    const cliente = dadosCPF?.dadosCliente
    return {
      cep: dadosPessoaisDraft?.cep ?? cliente?.cep ?? '',
      logradouro: dadosPessoaisDraft?.logradouro ?? cliente?.logradouro ?? '',
      numero: dadosPessoaisDraft?.numero ?? cliente?.numero ?? '',
      complemento:
        dadosPessoaisDraft?.complemento ?? cliente?.complemento ?? '',
      bairro: dadosPessoaisDraft?.bairro ?? cliente?.bairro ?? '',
      cidade: dadosPessoaisDraft?.cidade ?? cliente?.cidade ?? '',
      estado: dadosPessoaisDraft?.estado ?? cliente?.uf ?? '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<EnderecoFormData>({
    resolver: zodResolver(enderecoSchema),
    mode: 'onChange',
    defaultValues,
  })

  const watched = form.watch()
  const isValid = enderecoSchema.safeParse(watched).success

  useEffect(() => {
    if (clienteExistente) {
      form.trigger()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteExistente])

  const handleAddressFound = (address: InputCepAddress) => {
    form.setValue('logradouro', address.logradouro, { shouldValidate: true })
    form.setValue('bairro', address.bairro, { shouldValidate: true })
    form.setValue('cidade', address.localidade, { shouldValidate: true })
    form.setValue('estado', address.uf, { shouldValidate: true })
    toast.info('Endereço localizado', {
      description: `${address.logradouro}, ${address.bairro} - ${address.uf}`,
    })
    form.setFocus('numero')
  }

  const onSubmit = async (data: EnderecoFormData) => {
    if (!segmentoId || !formularioId) {
      toast.error('Erro de contexto', {
        description: 'Contexto do formulário não carregado. Recarregue a página.',
      })
      return
    }

    // Merge final do draft com os dados deste substep
    mergeDadosPessoaisDraft(data)
    const draft = { ...(useFormularioStore.getState().dadosPessoaisDraft ?? {}) }

    // Valida o schema completo antes de persistir
    const fullParse = dadosPessoaisSchema.safeParse(draft)
    if (!fullParse.success) {
      toast.error('Dados incompletos', {
        description:
          'Alguns campos dos passos anteriores não foram preenchidos corretamente. Volte e revise.',
      })
      return
    }

    const fullData = fullParse.data

    const rawCpf = parseCPF(fullData.cpf)
    const celularDigits = parseTelefone(fullData.celular)
    const localCelular =
      celularDigits.length === 13 && celularDigits.startsWith('55')
        ? celularDigits.slice(2)
        : celularDigits

    const telefoneDigits = fullData.telefone ? parseTelefone(fullData.telefone) : ''
    const localTelefone =
      telefoneDigits.length === 13 && telefoneDigits.startsWith('55')
        ? telefoneDigits.slice(2)
        : telefoneDigits

    try {
      setIsSubmitting(true)

      const payload = {
        cpf: rawCpf,
        operation: dadosCPF?.clienteExistente ? 'update' : 'insert',
        clienteId: dadosCPF?.clienteId,
        dados: {
          nome: fullData.name.trim(),
          cpf: rawCpf,
          email: fullData.email.trim(),
          celular: localCelular,
          telefone: localTelefone || undefined,
          rg: fullData.rg?.trim() || undefined,
          dataNascimento: fullData.dataNascimento,
          cep: parseCEP(fullData.cep ?? ''),
          logradouro: fullData.logradouro?.trim(),
          numero: fullData.numero?.trim(),
          complemento: fullData.complemento?.trim(),
          bairro: fullData.bairro?.trim(),
          cidade: fullData.cidade?.trim(),
          estado: fullData.estado,
          estadoCivil: fullData.estadoCivil,
          genero: fullData.genero,
          nacionalidade: fullData.nacionalidade,
        },
      }

      const response = await apiFetch(API_ROUTES.saveClient, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.success) {
        throw new Error(response.error || 'Erro ao salvar dados')
      }

      const result = response as { success: true; data: { cliente_id: number } }

      setDadosPessoais({
        cliente_id: result.data.cliente_id,
        nome_completo: fullData.name,
        cpf: rawCpf,
        rg: fullData.rg || undefined,
        data_nascimento: fullData.dataNascimento ?? '',
        estado_civil: fullData.estadoCivil ?? '',
        genero: fullData.genero ?? '',
        nacionalidade: fullData.nacionalidade ?? '',
        email: fullData.email ?? '',
        celular: localCelular,
        telefone: localTelefone || undefined,
        endereco_cep: parseCEP(fullData.cep ?? ''),
        endereco_logradouro: fullData.logradouro ?? '',
        endereco_numero: fullData.numero ?? '',
        endereco_complemento: fullData.complemento || undefined,
        endereco_bairro: fullData.bairro ?? '',
        endereco_cidade: fullData.cidade ?? '',
        endereco_uf: fullData.estado ?? '',
      })

      // Limpa draft após persistência bem-sucedida
      resetDadosPessoaisDraft()

      toast.success('Sucesso', { description: 'Dados salvos com sucesso!' })
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error)
      toast.error('Erro ao salvar dados', {
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao salvar seus dados. Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormStepLayout
      title={clienteExistente ? 'Confirme seu endereço' : 'Endereço'}
      description={
        clienteExistente
          ? 'Revise seu endereço e finalize os dados cadastrais.'
          : 'Onde você reside'
      }
      onPrevious={etapaAnterior}
      nextLabel={clienteExistente ? 'Confirmar e salvar' : 'Salvar e continuar'}
      isNextDisabled={isSubmitting || !isValid}
      isPreviousDisabled={isSubmitting}
      isLoading={isSubmitting}
      formId="endereco-form"
    >
      <Form {...form}>
        <form
          id="endereco-form"
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
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  CEP
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </FormLabel>
                <FormControl>
                  <InputCEP
                    placeholder="00000-000"
                    className="glass-field"
                    onAddressFound={handleAddressFound}
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
              name="logradouro"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, Avenida, etc."
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
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número"
                      className="glass-field"
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
            name="complemento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apto, Bloco, etc."
                    className="glass-field"
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
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bairro"
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
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cidade"
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
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-field">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ESTADOS_BRASILEIROS)
                        .sort((a, b) => a[1].localeCompare(b[1]))
                        .map(([uf, nome]) => (
                          <SelectItem key={uf} value={uf}>
                            {nome}
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
