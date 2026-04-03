'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import {
  actionCriarAdvogado,
  actionAtualizarAdvogado,
  type Advogado,
} from '@/app/(authenticated)/advogados';
import { UFS_BRASIL } from '@/app/(authenticated)/advogados';

const formSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  oab: z.string().min(1, 'OAB é obrigatória'),
  uf_oab: z.string().length(2, 'UF deve ter 2 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  advogado: Advogado | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccessAction: () => void;
}

export function AdvogadosDialog({ advogado, open, onOpenChangeAction, onSuccessAction }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!advogado;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_completo: '',
      cpf: '',
      oab: '',
      uf_oab: '',
    },
  });

  // Reset form when dialog opens/closes or advogado changes
  React.useEffect(() => {
    if (open) {
      if (advogado) {
        const primaryOab = advogado.oabs[0];
        form.reset({
          nome_completo: advogado.nome_completo,
          cpf: advogado.cpf,
          oab: primaryOab?.numero || '',
          uf_oab: primaryOab?.uf || '',
        });
      } else {
        form.reset({
          nome_completo: '',
          cpf: '',
          oab: '',
          uf_oab: '',
        });
      }
    }
  }, [open, advogado, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Remove formatação do CPF
      const cpfLimpo = values.cpf.replace(/\D/g, '');

      if (isEditing && advogado) {
        const result = await actionAtualizarAdvogado(advogado.id, {
          nome_completo: values.nome_completo,
          cpf: cpfLimpo,
          oabs: [{ numero: values.oab, uf: values.uf_oab }],
        });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar advogado');
        }

        toast.success('Advogado atualizado com sucesso!');
      } else {
        const result = await actionCriarAdvogado({
          nome_completo: values.nome_completo,
          cpf: cpfLimpo,
          oabs: [{ numero: values.oab, uf: values.uf_oab }],
        });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar advogado');
        }

        toast.success('Advogado cadastrado com sucesso!');
      }

      onSuccessAction();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar advogado');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Máscara de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    // Aplicar máscara
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    form.setValue('cpf', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Advogado' : 'Novo Advogado'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do advogado.'
              : 'Preencha os dados para cadastrar um novo advogado.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do advogado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={handleCpfChange}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número OAB</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uf_oab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF da OAB</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UFS_BRASIL.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChangeAction(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
