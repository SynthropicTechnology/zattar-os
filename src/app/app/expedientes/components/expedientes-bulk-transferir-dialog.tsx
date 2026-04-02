'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionBulkTransferirResponsavel, type ActionResult } from '../actions-bulk';

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ExpedientesBulkTransferirDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expedienteIds: number[];
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBulkTransferirDialog({
  open,
  onOpenChange,
  expedienteIds,
  usuarios,
  onSuccess,
}: ExpedientesBulkTransferirDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const actionWithIds = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      return actionBulkTransferirResponsavel(expedienteIds, prevState, formData);
    },
    [expedienteIds]
  );

  const [formState, formAction, isPending] = useActionState(actionWithIds, initialState);

  React.useEffect(() => {
    if (open) {
      setResponsavelId('');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (responsavelId === '' || responsavelId === 'null') {
      formData.append('responsavelId', '');
    } else {
      formData.append('responsavelId', responsavelId);
    }
    formAction(formData);
  };

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending || !responsavelId || responsavelId === 'null'}
      form="bulk-transferir-form"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Transferir {expedienteIds.length} {expedienteIds.length === 1 ? 'expediente' : 'expedientes'}
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Transferir ${expedienteIds.length} ${expedienteIds.length === 1 ? 'Expediente' : 'Expedientes'}`}
      maxWidth="md"
      footer={footerButtons}
    >
      <form id="bulk-transferir-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="responsavelId">Novo Responsável</Label>
          <Select
            value={responsavelId || 'null'}
            onValueChange={setResponsavelId}
            disabled={isPending}
          >
            <SelectTrigger id="responsavelId" className="w-full">
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Sem responsável</SelectItem>
              {usuarios.map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id.toString()}>
                  {usuario.nomeExibicao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {generalError && (
            <p className="text-sm font-medium text-destructive">{generalError}</p>
          )}
        </div>
      </form>
    </DialogFormShell>
  );
}

