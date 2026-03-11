'use client';

/**
 * Dialog para alterar responsável de um contrato individual.
 * Usado pela célula inline ResponsavelCell na tabela de contratos.
 * Segue o mesmo padrão de audiencias-alterar-responsavel-dialog.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { actionAlterarResponsavelContrato } from '../actions';
import type { Contrato } from '../domain';
import type { ClienteInfo } from '../types';

interface ContratoAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  usuarios: ClienteInfo[];
  onSuccess: () => void;
}

export function ContratoAlterarResponsavelDialog({
  open,
  onOpenChange,
  contrato,
  usuarios,
  onSuccess,
}: ContratoAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open && contrato) {
      setResponsavelId(contrato.responsavelId?.toString() || 'null');
    }
  }, [open, contrato]);

  if (!contrato) return null;

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      const idNumerico = responsavelId === 'null' || !responsavelId ? null : Number(responsavelId);
      const result = await actionAlterarResponsavelContrato(contrato.id, idNumerico);
      if (result.success) {
        toast.success('Responsável alterado com sucesso');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message || 'Erro ao alterar responsável');
      }
    } catch {
      toast.error('Erro ao alterar responsável');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Alterar Responsável"
      maxWidth="md"
      footer={
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="responsavel-contrato">Responsável</Label>
        <Select
          value={responsavelId || 'null'}
          onValueChange={setResponsavelId}
          disabled={isPending}
        >
          <SelectTrigger id="responsavel-contrato" className="w-full">
            <SelectValue placeholder="Selecione um responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Sem responsável</SelectItem>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id.toString()}>
                {usuario.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DialogFormShell>
  );
}
