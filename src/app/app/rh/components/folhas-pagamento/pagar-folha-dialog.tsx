
'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useContasBancarias } from '@/app/app/financeiro';
import { todayDateString } from '@/lib/date-utils';
import { pagarFolha } from '../../hooks';
import { FORMA_PAGAMENTO_FOLHA_LABELS } from '../../domain';
import type { FormaPagamentoFolha, PagarFolhaDTO } from '../../types';
import { toast } from 'sonner';

const schema = z.object({
  formaPagamento: z.string(),
  contaBancariaId: z.coerce.number().positive(),
  dataEfetivacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PagarFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: number | null;
  onSuccess?: () => void;
}

export function PagarFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  onSuccess,
}: PagarFolhaDialogProps) {
  const { contasBancarias } = useContasBancarias();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      formaPagamento: 'transferencia_bancaria',
      dataEfetivacao: todayDateString(),
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!folhaId) return;

    const payload: PagarFolhaDTO = {
      formaPagamento: values.formaPagamento as FormaPagamentoFolha,
      contaBancariaId: values.contaBancariaId,
      dataEfetivacao: values.dataEfetivacao || undefined,
      observacoes: values.observacoes,
    };

    const result = await pagarFolha(folhaId, payload);
    if (!result.success) {
      toast.error(result.error || 'Erro ao pagar folha');
      return;
    }

    toast.success('Folha paga com sucesso');
    onOpenChange(false);
    form.reset();
    onSuccess?.();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagar Folha</DialogTitle>
          <DialogDescription>Confirme a forma de pagamento e a data de efetivação.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Controller
              name="formaPagamento"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMA_PAGAMENTO_FOLHA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Conta Bancária</Label>
            <Controller
              name="contaBancariaId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta bancária" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancarias.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Efetivação</Label>
            <Input type="date" {...form.register('dataEfetivacao')} />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={3} {...form.register('observacoes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
