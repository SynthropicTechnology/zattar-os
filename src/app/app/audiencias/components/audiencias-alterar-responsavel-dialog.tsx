'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarAudiencia, type ActionResult } from '../actions';
import type { Audiencia } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
}

interface AudienciasAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audiencia: Audiencia | null;
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

export function AudienciasAlterarResponsavelDialog({
  open,
  onOpenChange,
  audiencia,
  usuarios,
  onSuccess,
}: AudienciasAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');

  const submitAction = async (state: ActionResult, payload: FormData) => {
    return actionAtualizarAudiencia(audiencia?.id || 0, state, payload);
  };

  const [formState, formAction, isPending] = useActionState(
    submitAction,
    initialState
  );

  React.useEffect(() => {
    if (open && audiencia) {
      setResponsavelId(audiencia.responsavelId?.toString() || '');
    }
  }, [open, audiencia]);

  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  if (!audiencia) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="alterar-responsavel-audiencia-form"
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
      <form id="alterar-responsavel-audiencia-form" action={formAction} className="space-y-4">
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
                  {getUsuarioNome(usuario)}
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
