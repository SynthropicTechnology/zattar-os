'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { actionBulkBaixar, type ActionResult } from '../actions-bulk';

interface ExpedientesBulkBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expedienteIds: number[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBulkBaixarDialog({
  open,
  onOpenChange,
  expedienteIds,
  onSuccess,
}: ExpedientesBulkBaixarDialogProps) {
  const [justificativa, setJustificativa] = React.useState('');
  const actionWithIds = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      return actionBulkBaixar(expedienteIds, prevState, formData);
    },
    [expedienteIds]
  );

  const [formState, formAction, isPending] = useActionState(actionWithIds, initialState);

  React.useEffect(() => {
    if (open) {
      setJustificativa('');
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
    formData.append('justificativaBaixa', justificativa.trim());
    formAction(formData);
  };

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending || !justificativa.trim()}
      form="bulk-baixar-form"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Baixar {expedienteIds.length} {expedienteIds.length === 1 ? 'expediente' : 'expedientes'}
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Baixar ${expedienteIds.length} ${expedienteIds.length === 1 ? 'Expediente' : 'Expedientes'}`}
      maxWidth="md"
      footer={footerButtons}
    >
      <form id="bulk-baixar-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="justificativaBaixa">
            Justificativa da Baixa <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="justificativaBaixa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Informe a justificativa para a baixa dos expedientes selecionados..."
            className="resize-none min-h-[100px]"
            disabled={isPending}
            required
          />
          <p className="text-xs text-muted-foreground">
            Esta justificativa será aplicada a todos os {expedienteIds.length} expediente(s) selecionado(s).
          </p>
          {generalError && (
            <p className="text-sm font-medium text-destructive">{generalError}</p>
          )}
        </div>
      </form>
    </DialogFormShell>
  );
}

