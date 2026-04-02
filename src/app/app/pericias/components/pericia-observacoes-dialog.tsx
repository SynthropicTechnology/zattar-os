'use client';

import * as React from 'react';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { Pericia } from '../domain';
import { actionAdicionarObservacao } from '../actions/pericias-actions';

interface PericiaObservacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pericia: Pericia | null;
  onSuccess?: () => void;
}

export function PericiaObservacoesDialog({
  open,
  onOpenChange,
  pericia,
  onSuccess,
}: PericiaObservacoesDialogProps) {
  const [observacoes, setObservacoes] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setObservacoes(pericia?.observacoes || '');
    setError(null);
    setIsSaving(false);
  }, [open, pericia]);

  const handleSave = async () => {
    if (!pericia) return;
    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('periciaId', String(pericia.id));
      formData.append('observacoes', observacoes);

      const result = await actionAdicionarObservacao(formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar observações.');
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
      title="Observações"
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
      <div className="grid grid-cols-1 gap-3">
        <Textarea
          value={observacoes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setObservacoes(e.target.value)
          }
          placeholder="Adicione observações sobre a perícia..."
          className="min-h-[140px] resize-none"
          disabled={isSaving}
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </DialogFormShell>
  );
}


