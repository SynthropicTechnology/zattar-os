'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarExpediente, type ActionResult } from '../actions';
import { Expediente } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ExpedientesAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesAlterarResponsavelDialog({
  open,
  onOpenChange,
  expediente,
  usuarios,
  onSuccess,
}: ExpedientesAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const wasSuccessRef = React.useRef(false);
  
  const submitAction = async (state: ActionResult, payload: FormData) => {
    return actionAtualizarExpediente(expediente?.id || 0, state, payload);
  };

  const [formState, formAction, isPending] = useActionState(
    submitAction,
    initialState
  );

  React.useEffect(() => {
    if (open && expediente) {
      setResponsavelId(expediente.responsavelId?.toString() || '');
    }
  }, [open, expediente]);

  React.useEffect(() => {
    if (!open) {
      wasSuccessRef.current = false;
    }
  }, [open]);

  React.useEffect(() => {
    const hasJustSucceeded = formState.success && !wasSuccessRef.current;

    if (hasJustSucceeded) {
      onSuccess();
      onOpenChange(false);
    }

    wasSuccessRef.current = formState.success;
  }, [formState.success, onSuccess, onOpenChange]);

  if (!expediente) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="alterar-responsavel-form"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Alterar Responsável"
      maxWidth="md"
      footer={footerButtons}
    >
      <form id="alterar-responsavel-form" action={formAction} className="space-y-4">
        <input
          type="hidden"
          name="responsavelId"
          value={responsavelId === 'null' ? '' : responsavelId}
        />
        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
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

