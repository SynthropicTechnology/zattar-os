'use client';

/**
 * PericiaDialog - Dialog "editar" (responsável + observações)
 * Mantido para cumprir a estrutura planejada (criação/edição).
 * Neste MVP, as ações disponíveis são as mesmas do plano: atribuir responsável e observações.
 */

import * as React from 'react';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Pericia } from '../domain';
import type { UsuarioOption } from '../types';
import { actionAtribuirResponsavel, actionAdicionarObservacao } from '../actions/pericias-actions';

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

interface PericiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pericia: Pericia | null;
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}

export function PericiaDialog({
  open,
  onOpenChange,
  pericia,
  usuarios,
  onSuccess,
}: PericiaDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [observacoes, setObservacoes] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setResponsavelId(pericia?.responsavelId ? String(pericia.responsavelId) : '');
    setObservacoes(pericia?.observacoes || '');
    setIsSaving(false);
    setError(null);
  }, [open, pericia]);

  const handleSave = async () => {
    if (!pericia) return;
    setIsSaving(true);
    setError(null);

    try {
      // 1) Responsável (se selecionado)
      if (responsavelId) {
        const rid = Number(responsavelId);
        if (!rid || Number.isNaN(rid)) throw new Error('Responsável inválido.');
        const fd = new FormData();
        fd.append('periciaId', String(pericia.id));
        fd.append('responsavelId', String(rid));
        const r = await actionAtribuirResponsavel(fd);
        if (!r.success) throw new Error(r.message || 'Erro ao atribuir responsável.');
      }

      // 2) Observações
      const fdObs = new FormData();
      fdObs.append('periciaId', String(pericia.id));
      fdObs.append('observacoes', observacoes);
      const o = await actionAdicionarObservacao(fdObs);
      if (!o.success) throw new Error(o.message || 'Erro ao atualizar observações.');

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
      title="Editar perícia"
      maxWidth="lg"
      footer={
        <Button onClick={handleSave} disabled={isSaving || !pericia}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Responsável</div>
          <Select value={responsavelId || '_none'} onValueChange={setResponsavelId}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sem responsável</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {getUsuarioNome(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 grid gap-2">
          <div className="text-sm font-medium">Observações</div>
          <Textarea
            value={observacoes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
            placeholder="Adicione observações sobre a perícia..."
            className="min-h-30 resize-none"
            disabled={isSaving}
          />
        </div>

        {error && <div className="md:col-span-2 text-sm text-destructive">{error}</div>}
      </div>
    </DialogFormShell>
  );
}


