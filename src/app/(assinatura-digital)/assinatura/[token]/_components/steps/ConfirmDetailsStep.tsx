"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, CreditCard, Mail, Phone } from "lucide-react";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import InputCPF from '@/shared/assinatura-digital/components/inputs/input-cpf';
import { InputTelefone } from "@/components/ui/input-telefone";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCPF, formatTelefone } from '@/shared/assinatura-digital/utils/formatters';

/**
 * Schema de validação do formulário com mensagens em PT-BR.
 * Independente do schema de domínio para evitar herdar mensagens em inglês do Zod.
 */
const confirmDetailsSchema = z.object({
  nome_completo: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      z.string().refine((val) => val.length === 11, "CPF deve conter 11 dígitos")
    ),
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  telefone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      z.string().refine((val) => val.length >= 10, "Telefone deve ter no mínimo 10 dígitos")
    ),
});

// Input type (before transform) for the form fields
type ConfirmDetailsFormInput = {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
};

// Output type (after transform) for API submission
type ConfirmDetailsFormData = z.infer<typeof confirmDetailsSchema>;

export interface ConfirmDetailsStepProps {
  token: string;
  dadosSnapshot: {
    nome_completo?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  };
  currentStep?: number;
  totalSteps?: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function ConfirmDetailsStep({
  token,
  dadosSnapshot,
  currentStep = 1,
  totalSteps = 3,
  onPrevious,
  onNext,
}: ConfirmDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConfirmDetailsFormInput>({
    resolver: zodResolver(confirmDetailsSchema),
    mode: "onBlur",
    defaultValues: {
      nome_completo: dadosSnapshot.nome_completo || "",
      cpf: dadosSnapshot.cpf ? formatCPF(dadosSnapshot.cpf) : "",
      email: dadosSnapshot.email || "",
      telefone: dadosSnapshot.telefone
        ? formatTelefone(dadosSnapshot.telefone)
        : "",
    },
  });

  const onSubmit = async (data: ConfirmDetailsFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/assinatura-digital/public/${token}/identificacao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_completo: data.nome_completo,
            cpf: data.cpf,
            email: data.email,
            telefone: data.telefone,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar dados");
      }

      toast.success("Dados confirmados com sucesso!");
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar dados"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicStepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Confirme Seus Dados"
      description="Revise suas informações abaixo. Edite qualquer campo se necessário antes de prosseguir."
      onPrevious={onPrevious}
      onNext={form.handleSubmit(onSubmit)}
      isNextDisabled={isSubmitting}
      isLoading={isSubmitting}
      nextLabel="Continuar"
      previousLabel="Voltar"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-3 sm:gap-4"
        >
          {/* Campo Nome Completo */}
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Nome Completo</FormLabel>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite seu nome completo"
                      className="pl-10"
                      autoComplete="name"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo CPF */}
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">CPF</FormLabel>
                <div className="relative">
                  <CreditCard
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <InputCPF
                      {...field}
                      placeholder="000.000.000-00"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos Email e Telefone lado a lado em desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Campo Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">E-mail</FormLabel>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="nome@exemplo.com"
                        className="pl-10"
                        autoComplete="email"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Telefone */}
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Telefone</FormLabel>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10"
                      aria-hidden="true"
                    />
                    <FormControl>
                      <InputTelefone
                        {...field}
                        mode="cell"
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                        autoComplete="tel"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Hidden submit button for form submission */}
          <button
            type="submit"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          >
            Enviar
          </button>
        </form>
      </Form>
    </PublicStepLayout>
  );
}
