'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verificarCPFSchema, type VerificarCPFFormData } from '@/shared/assinatura-digital/validations/verificar-cpf.schema';
import InputCPF from '@/shared/assinatura-digital/components/inputs/input-cpf';
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import { toast } from 'sonner';
import { API_ROUTES } from '@/shared/assinatura-digital/constants';
import { parseCPF, validateCPF } from '@/shared/assinatura-digital/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ClienteAssinaturaDigital, ContratoPendente } from '@/shared/assinatura-digital/types/store';
import FormStepLayout from './form-step-layout';

type VerificarCPFResponse = {
  exists: boolean;
  cliente?: ClienteAssinaturaDigital | null;
  contratos_pendentes?: ContratoPendente[];
};

export default function VerificarCPF() {
  const [isValidating, setIsValidating] = useState(false);
  const { setDadosCPF, setContratosPendentes, proximaEtapa, resetAll } = useFormularioStore();

  const form = useForm<VerificarCPFFormData>({
    resolver: zodResolver(verificarCPFSchema),
    mode: 'onChange',
    defaultValues: {
      cpf: '',
    },
  });

  const onSubmit = async (data: VerificarCPFFormData) => {
    try {
      // Remover formatação do CPF
      const cpfDigits = parseCPF(data.cpf);

      // Validação local redundante (segurança)
      if (!validateCPF(cpfDigits)) {
        toast.error('CPF inválido', {
          description: 'CPF inválido. Verifique os dígitos informados.',
        });
        return;
      }

      setIsValidating(true);

      // Se o CPF digitado é diferente de um draft anterior persistido,
      // limpa todo o estado antes de prosseguir (evita mistura de dados entre clientes).
      const persisted = useFormularioStore.getState();
      if (persisted.dadosCPF?.cpf && persisted.dadosCPF.cpf !== cpfDigits) {
        // Preservar contexto do formulário (segmento/formulario) após reset
        const { segmentoId, formularioId, sessaoId } = persisted;
        resetAll();
        if (segmentoId && formularioId) {
          useFormularioStore.getState().setContexto(segmentoId, formularioId);
          if (sessaoId) useFormularioStore.getState().setSessaoId(sessaoId);
        }
      }

      // Verificar se cliente existe no sistema via API verificar-cpf
      const response = await fetch(API_ROUTES.verificarCpf, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfDigits }),
      });

      // Tratar erros HTTP (4xx, 5xx)
      if (!response.ok) {
        console.error(`verificarCpf API erro: ${response.status} ${response.statusText}`);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const apiResult: VerificarCPFResponse = await response.json();

      // Cenário 1: Cliente existe no sistema
      if (apiResult.exists === true && apiResult.cliente) {
        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: true,
          clienteId: apiResult.cliente.id,
          dadosCliente: apiResult.cliente,
        });

        // Verificar se há contratos pendentes de assinatura
        if (apiResult.contratos_pendentes && apiResult.contratos_pendentes.length > 0) {
          setContratosPendentes(apiResult.contratos_pendentes);
          toast.info('Contratos pendentes encontrados', {
            description: `Você possui ${apiResult.contratos_pendentes.length} contrato(s) aguardando assinatura.`,
          });
        } else {
          toast.success('CPF encontrado!', {
            description: 'Seus dados foram localizados no sistema.',
          });
        }

        proximaEtapa();
        return;
      }

      // Cenário 2: Cliente não existe no sistema (novo cadastro)
      if (apiResult.exists === false) {
        toast.info('CPF válido', {
          description: 'Por favor, preencha seus dados cadastrais.',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        proximaEtapa();
        return;
      }

      // Cenário 3: Fallback (exists não é boolean - resposta inesperada)
      if (typeof apiResult.exists !== 'boolean') {
        console.warn('verificarCpf API retornou resposta inesperada:', apiResult);
        toast.warning('Atenção', {
          description: 'Não foi possível validar completamente. Continuando...',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        proximaEtapa();
      }
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);

      toast.error('Erro ao verificar CPF', {
        description: 'Ocorreu um erro ao validar o CPF. Tente novamente.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <FormStepLayout
      title="Informe seu CPF"
      description="Digite seu CPF para iniciar"
      nextLabel="Continuar"
      isNextDisabled={isValidating || !form.formState.isValid}
      isLoading={isValidating}
      hidePrevious={true}
      formId="verificar-cpf-form"
    >
      <Form {...form}>
        <form
          id="verificar-cpf-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-meta-label text-muted-foreground">CPF</FormLabel>
                <FormControl>
                  <InputCPF
                    placeholder="000.000.000-00"
                    disabled={isValidating}
                    autoFocus={true}
                    className="glass-field h-14 text-lg tracking-wide"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormStepLayout>
  );
}