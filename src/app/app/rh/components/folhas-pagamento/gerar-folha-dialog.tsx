
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gerarFolha } from '../../hooks';
import type { GerarFolhaDTO } from '../../types';
import { MESES_LABELS } from '../../domain';
import { toast } from 'sonner';

const schema = z.object({
  mesReferencia: z.coerce.number().min(1).max(12),
  anoReferencia: z.coerce.number().min(2020),
  dataPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface GerarFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (folhaId?: number) => void;
}

export function GerarFolhaDialog({ open, onOpenChange, onSuccess }: GerarFolhaDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mesReferencia: new Date().getMonth() + 1,
      anoReferencia: new Date().getFullYear(),
      dataPagamento: undefined,
      observacoes: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: GerarFolhaDTO = {
      mesReferencia: values.mesReferencia,
      anoReferencia: values.anoReferencia,
      dataPagamento: values.dataPagamento || undefined,
      observacoes: values.observacoes,
    };

    const result = await gerarFolha(payload);
    if (!result.success) {
      toast.error(result.error || 'Erro ao gerar folha');
      return;
    }

    toast.success('Folha gerada com sucesso');
    onOpenChange(false);
    form.reset();
    onSuccess?.(result.data?.id);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar Nova Folha</DialogTitle>
          <DialogDescription>Selecione o período para gerar a folha de pagamento.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Controller
                name="mesReferencia"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESES_LABELS).map(([value, label]) => (
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
              <Label>Ano</Label>
              <Input
                type="number"
                {...form.register('anoReferencia', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Pagamento (opcional)</Label>
            <Input type="date" {...form.register('dataPagamento')} />
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
              Gerar Folha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
