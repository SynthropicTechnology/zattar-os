'use client';

import * as React from 'react';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Pericia } from '../domain';
import type { UsuarioOption } from '../types';
import { actionAtribuirResponsavel } from '../actions/pericias-actions';

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

interface PericiaAtribuirResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pericia: Pericia | null;
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}

export function PericiaAtribuirResponsavelDialog({
  open,
  onOpenChange,
  pericia,
  usuarios,
  onSuccess,
}: PericiaAtribuirResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setResponsavelId(pericia?.responsavelId ? String(pericia.responsavelId) : '');
    setError(null);
    setIsSaving(false);
  }, [open, pericia]);

  const handleSave = async () => {
    if (!pericia) return;
    setIsSaving(true);
    setError(null);

    try {
      const rid = Number(responsavelId);
      if (!rid || Number.isNaN(rid)) {
        throw new Error('Selecione um responsável.');
      }

      const formData = new FormData();
      formData.append('periciaId', String(pericia.id));
      formData.append('responsavelId', String(rid));

      const result = await actionAtribuirResponsavel(formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atribuir responsável.');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Atribuir responsável"
      maxWidth="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !pericia}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Responsável</div>
          <Select value={responsavelId || '_none'} onValueChange={setResponsavelId}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none" disabled>
                Selecione...
              </SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {getUsuarioNome(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </DialogFormShell>
  );
}


