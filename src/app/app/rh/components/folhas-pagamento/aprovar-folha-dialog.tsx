
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
import { Textarea } from '@/components/ui/textarea';
import { useCentrosCusto, useContasBancarias, usePlanoContas } from '@/app/app/financeiro';
import { aprovarFolha } from '../../hooks';
import type { AprovarFolhaDTO } from '../../types';
import { toast } from 'sonner';

const schema = z.object({
  contaBancariaId: z.coerce.number().positive(),
  contaContabilId: z.coerce.number().positive(),
  centroCustoId: z.coerce.number().positive().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AprovarFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: number | null;
  onSuccess?: () => void;
}

export function AprovarFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  onSuccess,
}: AprovarFolhaDialogProps) {
  const { contasBancarias } = useContasBancarias();
  const { planoContas } = usePlanoContas({
    ativo: true,
    nivel: 'analitica',
    tipoConta: 'despesa',
    limite: 200,
  });
  const { centrosCusto } = useCentrosCusto();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!folhaId) return;

    const payload: AprovarFolhaDTO = {
      contaBancariaId: values.contaBancariaId,
      contaContabilId: values.contaContabilId,
      centroCustoId: values.centroCustoId,
      observacoes: values.observacoes,
    };

    const result = await aprovarFolha(folhaId, payload);
    if (!result.success) {
      toast.error(result.error || 'Erro ao aprovar folha');
      return;
    }

    toast.success('Folha aprovada com sucesso');
    onOpenChange(false);
    form.reset();
    onSuccess?.();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aprovar Folha</DialogTitle>
          <DialogDescription>Selecione as contas para gerar os lançamentos financeiros.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Conta Bancária</Label>
            <Controller
              name="contaBancariaId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value?.toString() ?? ''} onValueChange={(value) => field.onChange(Number(value))}>
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
            <Label>Conta Contábil</Label>
            <Controller
              name="contaContabilId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta contábil" />
                  </SelectTrigger>
                  <SelectContent>
                    {planoContas.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.codigo} - {conta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Centro de Custo (opcional)</Label>
            <Controller
              name="centroCustoId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map((centro) => (
                      <SelectItem key={centro.id} value={centro.id.toString()}>
                        {centro.codigo} - {centro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
              Aprovar Folha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
