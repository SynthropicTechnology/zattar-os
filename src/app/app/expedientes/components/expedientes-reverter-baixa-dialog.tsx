'use client';

// Componente de diálogo para reverter baixa de expediente

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { actionReverterBaixa, type ActionResult } from '../actions';
import { Expediente } from '../domain';
import { DialogFormShell } from '@/components/shared/dialog-shell';


interface ExpedientesReverterBaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesReverterBaixaDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesReverterBaixaDialogProps) {
  // Usar key para resetar o formulário quando o diálogo fechar
  const [formKey, setFormKey] = React.useState(0);

  const [formState, formAction, isPending] = useActionState(
    actionReverterBaixa.bind(null, expediente?.id || 0),
    initialState
  );

  // Resetar estado quando fechar
  React.useEffect(() => {
    if (!open) {
      setFormKey((prev) => prev + 1);
    }
  }, [open]);

  // Chamar onSuccess quando a ação for bem-sucedida
  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  if (!expediente) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <div className="flex w-full items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isPending}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="destructive"
        disabled={isPending}
        form="reverter-baixa-form"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reverter Baixa
      </Button>
    </div>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Reverter Baixa de Expediente"
      maxWidth="lg"
      footer={footerButtons}
    >
      <form id="reverter-baixa-form" key={formKey} action={formAction} className="space-y-6">
        {/* Informações do expediente */}
        <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
          <div className="text-sm font-medium">Expediente</div>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Processo:</span> {expediente.numeroProcesso}
            </div>
            <div>
              <span className="font-medium">Parte Autora:</span> {expediente.nomeParteAutora}
            </div>
            <div>
              <span className="font-medium">Parte Ré:</span> {expediente.nomeParteRe}
            </div>
            {expediente.baixadoEm && (
              <div>
                <span className="font-medium">Baixado em:</span>{' '}
                {new Date(expediente.baixadoEm).toLocaleString('pt-BR')}
              </div>
            )}
            {expediente.protocoloId && (
              <div>
                <span className="font-medium">Protocolo:</span> {expediente.protocoloId}
              </div>
            )}
            {expediente.justificativaBaixa && (
              <div>
                <span className="font-medium">Justificativa:</span>{' '}
                {expediente.justificativaBaixa}
              </div>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-warning mb-1">Atenção</div>
            <div className="text-muted-foreground">
              Ao reverter a baixa, o expediente voltará a aparecer na lista de pendentes.
              Os dados de protocolo e justificativa serão removidos, mas a ação será registrada
              nos logs do sistema.
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {generalError && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {generalError}
          </div>
        )}
      </form>
    </DialogFormShell>
  );
}
