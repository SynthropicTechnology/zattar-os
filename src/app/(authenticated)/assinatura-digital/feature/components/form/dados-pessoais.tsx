'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import {
  dadosPessoaisSchema,
  DadosPessoaisFormData,
} from '../../validations/dados-pessoais.schema';
import InputCPF from '../inputs/input-cpf';
import { InputTelefone } from '@/components/ui/input-telefone';
import { InputCEP, type InputCepAddress } from '@/app/(authenticated)/enderecos';
import InputData from '../inputs/input-data';
import { useFormularioStore } from '../../store';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/http/api-fetch';
import { formatCPF, parseCPF, formatData, formatTelefone, parseTelefone, parseCEP } from '../../utils/formatters';
import {
  API_ROUTES,
  ESTADOS_BRASILEIROS,
  ESTADOS_CIVIS,
  GENEROS,
  NACIONALIDADES,
} from '../../constants';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  TEXT_LIMITS,
  validateBirthDate,
  validateBrazilianPhone,
  validateCEP,
  validateCPFDigits,
  validateEmail,
  validateTextLength,
} from '../../utils';
import FormStepLayout from './form-step-layout';

export default function DadosPessoais() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    dadosCPF,
    segmentoId,
    formularioId,
    setDadosPessoais,
    proximaEtapa,
    etapaAnterior,
    getTotalSteps,
    etapaAtual,
  } = useFormularioStore();

  const form = useForm({
    resolver: zodResolver(dadosPessoaisSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      estadoCivil: '1',
      genero: '1',
      nacionalidade: '30',
      email: '',
      celular: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  });

  // Validação manual via safeParse para contornar dessincronização do
  // formState.isValid com inputs mascarados (IMaskInput).
  // form.watch() subscreve a todas as mudanças de campo e re-renderiza o
  // componente a cada alteração. safeParse valida diretamente contra o
  // schema Zod, independente do estado interno do RHF.
  // NOTA: Não usar useMemo aqui — form.watch() retorna a mesma referência
  // de objeto, então useMemo nunca recomputaria após form.reset().
  const watchedValues = form.watch();
  const isFormValid = dadosPessoaisSchema.safeParse(watchedValues).success;



  // Prefill de dados existentes
  useEffect(() => {
    const prefillData = async () => {
      if (dadosCPF?.clienteExistente && dadosCPF.dadosCliente) {
        const cliente = dadosCPF.dadosCliente;

        // Extract address data from cliente (using correct property names)
        const cep = cliente.cep ?? '';
        const logradouro = cliente.logradouro ?? '';
        const numero = cliente.numero ?? '';
        const complemento = cliente.complemento ?? '';
        const bairro = cliente.bairro ?? '';
        const cidade = cliente.cidade ?? '';
        const estado = cliente.uf ?? '';

        form.reset({
          name: cliente.nome ?? '',
          cpf: formatCPF(cliente.cpf ?? ''),
          rg: cliente.rg ?? '',
          dataNascimento: formatData(cliente.data_nascimento ?? ''),
          estadoCivil: cliente.estado_civil ?? '1',
          genero: cliente.genero ?? '1',
          nacionalidade: cliente.nacionalidade ?? '30',
          email: cliente.email || '',
          celular: formatTelefone(cliente.celular || ''),
          telefone: cliente.telefone ? formatTelefone(cliente.telefone) : '',
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
        });

        // Trigger validation to update isValid state
        await form.trigger();
      } else if (dadosCPF?.cpf) {
        // Cliente novo - preencher apenas CPF (shouldValidate garante que a validação é disparada)
        form.setValue('cpf', formatCPF(dadosCPF.cpf), { shouldValidate: true });
      }
    };

    prefillData();
  }, [dadosCPF, form]);

  // Handler para busca automA¡tica de CEP
  const handleAddressFound = (address: InputCepAddress) => {
    form.setValue('logradouro', address.logradouro, { shouldValidate: true });
    form.setValue('bairro', address.bairro, { shouldValidate: true });
    form.setValue('cidade', address.localidade, { shouldValidate: true });
    form.setValue('estado', address.uf, { shouldValidate: true });
    toast.info('Endereço localizado', {
      description: `${address.logradouro}, ${address.bairro} - ${address.uf}`,
    });
    form.setFocus('numero');
  };

  const onSubmit = async (data: DadosPessoaisFormData) => {
    // Guard: Garantir que o contexto está hidratado antes de submeter
    if (!segmentoId || !formularioId) {
      toast.error('Erro de contexto', {
        description: 'Contexto do formulário não carregado. Aguarde um momento e tente novamente.'
      });
      return;
    }

    const rawCpf = parseCPF(data.cpf);
    const celularDigits = parseTelefone(data.celular);
    const localCelular =
      celularDigits.length === 13 && celularDigits.startsWith('55')
        ? celularDigits.slice(2)
        : celularDigits;

    const telefoneDigits = data.telefone ? parseTelefone(data.telefone) : '';
    const localTelefone =
      telefoneDigits.length === 13 && telefoneDigits.startsWith('55')
        ? telefoneDigits.slice(2)
        : telefoneDigits;

    const issues: string[] = [];

    const cpfCheck = validateCPFDigits(rawCpf);
    if (!cpfCheck.valid) {
      issues.push(cpfCheck.message ?? 'CPF invalido');
    }

    const birthCheck = validateBirthDate(data.dataNascimento ?? '');
    if (!birthCheck.valid) {
      issues.push(birthCheck.message ?? 'Data de nascimento invalida');
    }

    const emailCheck = validateEmail(data.email);
    if (!emailCheck.valid) {
      issues.push(emailCheck.message ?? 'Email invalido');
    }

    const celularCheck = validateBrazilianPhone(localCelular);
    if (!celularCheck.valid) {
      issues.push(celularCheck.message ?? 'Celular invalido');
    }

    if (localTelefone) {
      const telefoneCheck = validateBrazilianPhone(localTelefone);
      if (!telefoneCheck.valid) {
        issues.push(telefoneCheck.message ?? 'Telefone invalido');
      }
    }

    const cepCheck = validateCEP(data.cep ?? '');
    if (!cepCheck.valid) {
      issues.push(cepCheck.message ?? 'CEP invalido');
    }

    const textFields: Array<[string, string, keyof typeof TEXT_LIMITS]> = [
      [data.logradouro ?? '', 'Logradouro', 'logradouro'],
      [data.bairro ?? '', 'Bairro', 'bairro'],
      [data.cidade ?? '', 'Cidade', 'cidade'],
    ];

    if (data.complemento) {
      textFields.push([data.complemento, 'Complemento', 'complemento']);
    }

    textFields.forEach(([value, label, key]) => {
      const result = validateTextLength(value ?? '', key);
      if (!result.valid && result.message) {
        issues.push(`${label}: ${result.message}`);
      }
    });

    if (issues.length > 0) {
      toast.warning('Revise os dados informados', {
        description: issues.map((item) => `- ${item}`).join('\n'),
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        cpf: rawCpf,
        operation: dadosCPF?.clienteExistente ? 'update' : 'insert',
        clienteId: dadosCPF?.clienteId,
        dados: {
          nome: data.name.trim(),
          cpf: rawCpf,
          email: data.email.trim(),
          celular: localCelular,
          telefone: localTelefone || undefined,
          rg: data.rg?.trim() || undefined,
          dataNascimento: data.dataNascimento,
          cep: parseCEP(data.cep ?? ''),
          logradouro: data.logradouro?.trim(),
          numero: data.numero?.trim(),
          complemento: data.complemento?.trim(),
          bairro: data.bairro?.trim(),
          cidade: data.cidade?.trim(),
          estado: data.estado,
          estadoCivil: data.estadoCivil,
          genero: data.genero,
          nacionalidade: data.nacionalidade,
        },
      };

      const response = await apiFetch(API_ROUTES.saveClient, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao salvar dados');
      }

      const result = response as { success: true; data: { cliente_id: number } };

      setDadosPessoais({
        cliente_id: result.data.cliente_id,
        nome_completo: data.name,
        cpf: rawCpf,
        rg: data.rg || undefined,
        data_nascimento: data.dataNascimento ?? '',
        estado_civil: data.estadoCivil ?? '',
        genero: data.genero ?? '',
        nacionalidade: data.nacionalidade ?? '',
        email: data.email ?? '',
        celular: localCelular,
        telefone: localTelefone || undefined,
        endereco_cep: parseCEP(data.cep ?? ''),
        endereco_logradouro: data.logradouro ?? '',
        endereco_numero: data.numero ?? '',
        endereco_complemento: data.complemento || undefined,
        endereco_bairro: data.bairro ?? '',
        endereco_cidade: data.cidade ?? '',
        endereco_uf: data.estado ?? '',
      });

      toast.success('Sucesso', {
        description: 'Dados salvos com sucesso!',
      });

      proximaEtapa();
    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error);

      toast.error('Erro ao salvar dados', {
        description:
          error instanceof Error ? error.message : 'Ocorreu um erro ao salvar seus dados. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevenir submit se contexto não estiver carregado
  const isContextReady = Boolean(segmentoId && formularioId);

  return (
    <FormStepLayout
      title="Dados Pessoais"
      description={dadosCPF?.clienteExistente ? 'Revise e atualize seus dados cadastrais' : 'Preencha seus dados cadastrais'}
      currentStep={etapaAtual}
      totalSteps={getTotalSteps()}
      onPrevious={etapaAnterior}
      nextLabel="Próximo"
      isNextDisabled={isSubmitting || !isFormValid || !isContextReady}
      isPreviousDisabled={isSubmitting}
      isLoading={isSubmitting}
      cardClassName="w-full max-w-3xl mx-auto"
      formId="dados-pessoais-form"
    >
      <Form {...form}>
        <form
          id="dados-pessoais-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Seção: Informações Pessoais */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold">Informações Pessoais</h3>

            {/* Linha 1: Nome Completo */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite seu nome completo"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 2: Data de Nascimento + Gênero + Nacionalidade + Estado Civil */}
            <div className="flex flex-col md:flex-row gap-6">
              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="flex items-center gap-2">
                      Data de Nascimento
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <InputData
                        placeholder="dd/mm/aaaa"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Gênero</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                  <FormItem className="flex-1">
                    <FormLabel>Nacionalidade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Brasileira no topo */}
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
                  <FormItem className="flex-1">
                    <FormLabel>Estado Civil</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
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

            {/* Linha 3: CPF + RG */}
            <div className="flex flex-col md:flex-row gap-6">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <InputCPF
                        placeholder="000.000.000-00"
                        disabled={true}
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
                  <FormItem className="flex-1">
                    <FormLabel>RG (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite seu RG"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Seção: Contatos */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold">Contatos</h3>

            {/* Linha 1: Celular + Telefone de Contato */}
            <div className="flex flex-col md:flex-row gap-6">
              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="flex items-center gap-2">
                      Celular
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <InputTelefone
                        mode="cell"
                        placeholder="(00) 00000-0000"
                        disabled={isSubmitting}
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
                  <FormItem className="flex-1">
                    <FormLabel>Telefone de Contato</FormLabel>
                    <FormControl>
                      <InputTelefone
                        mode="landline"
                        placeholder="(00) 0000-0000"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2: E-mail */}
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
                      placeholder="seu@email.com"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Seção: Endereço */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold">Endereço</h3>

            {/* Linha 1: CEP */}
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
                      disabled={isSubmitting}
                      onAddressFound={handleAddressFound}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 2: Logradouro + Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="logradouro"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, Avenida, etc."
                        disabled={isSubmitting}
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
                  <FormItem className="md:col-span-1">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 3: Complemento + Bairro + Cidade + Estado */}
            <div className="flex flex-col md:flex-row gap-6">
              <FormField
                control={form.control}
                name="complemento"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apto, Bloco, etc."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bairro"
                        disabled={isSubmitting}
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
                  <FormItem className="flex-1">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cidade"
                        disabled={isSubmitting}
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
                  <FormItem className="flex-1">
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
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
          </div>
          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
            Submit
          </button>
        </form>
      </Form>
    </FormStepLayout>
  );
}
