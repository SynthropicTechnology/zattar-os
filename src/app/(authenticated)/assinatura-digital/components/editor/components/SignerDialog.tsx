'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import type { Signatario } from '../types';

const signerSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

type SignerFormData = z.infer<typeof signerSchema>;

interface SignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signer?: Signatario;
  onSave: (nome: string, email: string) => void;
  mode: 'add' | 'edit';
}

/**
 * SignerDialog - Dialog for adding or editing a signer
 */
export default function SignerDialog({
  open,
  onOpenChange,
  signer,
  onSave,
  mode,
}: SignerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignerFormData>({
    resolver: zodResolver(signerSchema),
    defaultValues: {
      nome: signer?.nome || '',
      email: signer?.email || '',
    },
  });

  // Reset form when dialog opens or signer changes
  useEffect(() => {
    if (open) {
      reset({
        nome: signer?.nome || '',
        email: signer?.email || '',
      });
    }
  }, [open, signer, reset]);

  const onSubmit = (data: SignerFormData) => {
    onSave(data.nome, data.email);
    onOpenChange(false);
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Adicionar Signatário' : 'Editar Signatário'}
      maxWidth="sm"
      footer={
        <Button type="submit" form="signer-form" disabled={isSubmitting}>
          {mode === 'add' ? 'Adicionar' : 'Salvar'}
        </Button>
      }
    >
      <form id="signer-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            placeholder="Nome completo"
            autoFocus
            {...register('nome')}
            aria-invalid={!!errors.nome}
          />
          {errors.nome && (
            <p className="text-xs text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </form>
    </DialogFormShell>
  );
}
