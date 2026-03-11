'use client';

/**
 * CONTRATOS FEATURE - Componentes de Ações em Massa
 *
 * Barra de ações + dialogs para operações bulk em contratos selecionados.
 * Padrão: barra aparece quando há linhas selecionadas, com botões
 * que abrem dialogs de confirmação/seleção.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2, X, Trash2, UserRound, ArrowRightLeft, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import {
  actionAlterarStatusContratosEmMassa,
  actionAtribuirResponsavelContratosEmMassa,
  actionAlterarSegmentoContratosEmMassa,
  actionExcluirContratosEmMassa,
} from '../actions';
import { STATUS_CONTRATO_LABELS } from '../domain';
import type { ClienteInfo } from '../types';

// =============================================================================
// BARRA DE AÇÕES EM MASSA
// =============================================================================

interface ContratosBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAlterarStatus: () => void;
  onAtribuirResponsavel: () => void;
  onAlterarSegmento: () => void;
  onExcluir: () => void;
}

export function ContratosBulkActionsBar({
  selectedCount,
  onClearSelection,
  onAlterarStatus,
  onAtribuirResponsavel,
  onAlterarSegmento,
  onExcluir,
}: ContratosBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-1 ml-2">
        <Button variant="outline" size="sm" onClick={onAlterarStatus}>
          <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
          Alterar Status
        </Button>
        <Button variant="outline" size="sm" onClick={onAtribuirResponsavel}>
          <UserRound className="mr-1.5 h-3.5 w-3.5" />
          Responsável
        </Button>
        <Button variant="outline" size="sm" onClick={onAlterarSegmento}>
          <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
          Segmento
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onExcluir}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onClearSelection} className="ml-auto">
        <X className="mr-1 h-3.5 w-3.5" />
        Limpar
      </Button>
    </div>
  );
}

// =============================================================================
// DIALOG: ALTERAR STATUS EM MASSA
// =============================================================================

interface AlterarStatusMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function AlterarStatusMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: AlterarStatusMassaDialogProps) {
  const [novoStatus, setNovoStatus] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setNovoStatus('');
  }, [open]);

  const handleSubmit = async () => {
    if (!novoStatus) return;
    setIsPending(true);
    try {
      const result = await actionAlterarStatusContratosEmMassa(selectedIds, novoStatus);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao alterar status em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Alterar Status"
      description={`Alterar status de ${selectedIds.length} contrato(s) selecionado(s).`}
      maxWidth="sm"
      footer={
        <Button onClick={handleSubmit} disabled={isPending || !novoStatus}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar
        </Button>
      }
    >
      <div className="space-y-2">
        <Label>Novo Status</Label>
        <Select value={novoStatus} onValueChange={setNovoStatus} disabled={isPending}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o novo status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONTRATO_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DialogFormShell>
  );
}

// =============================================================================
// DIALOG: ATRIBUIR RESPONSÁVEL EM MASSA
// =============================================================================

interface AtribuirResponsavelMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  usuarios: ClienteInfo[];
  onSuccess: () => void;
}

export function AtribuirResponsavelMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  usuarios,
  onSuccess,
}: AtribuirResponsavelMassaDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setResponsavelId('');
  }, [open]);

  const handleSubmit = async () => {
    if (!responsavelId) return;
    setIsPending(true);
    try {
      const idNumerico = responsavelId === 'null' ? null : Number(responsavelId);
      const result = await actionAtribuirResponsavelContratosEmMassa(selectedIds, idNumerico);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao atribuir responsável em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Atribuir Responsável"
      description={`Atribuir responsável a ${selectedIds.length} contrato(s) selecionado(s).`}
      maxWidth="sm"
      footer={
        <Button onClick={handleSubmit} disabled={isPending || !responsavelId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar
        </Button>
      }
    >
      <div className="space-y-2">
        <Label>Responsável</Label>
        <Select value={responsavelId} onValueChange={setResponsavelId} disabled={isPending}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Sem responsável</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id.toString()}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DialogFormShell>
  );
}

// =============================================================================
// DIALOG: ALTERAR SEGMENTO EM MASSA
// =============================================================================

interface AlterarSegmentoMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  segmentos: Array<{ id: number; nome: string }>;
  onSuccess: () => void;
}

export function AlterarSegmentoMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  segmentos,
  onSuccess,
}: AlterarSegmentoMassaDialogProps) {
  const [segmentoId, setSegmentoId] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setSegmentoId('');
  }, [open]);

  const handleSubmit = async () => {
    if (!segmentoId) return;
    setIsPending(true);
    try {
      const idNumerico = segmentoId === 'null' ? null : Number(segmentoId);
      const result = await actionAlterarSegmentoContratosEmMassa(selectedIds, idNumerico);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao alterar segmento em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Alterar Segmento"
      description={`Alterar segmento de ${selectedIds.length} contrato(s) selecionado(s).`}
      maxWidth="sm"
      footer={
        <Button onClick={handleSubmit} disabled={isPending || !segmentoId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar
        </Button>
      }
    >
      <div className="space-y-2">
        <Label>Segmento</Label>
        <Select value={segmentoId} onValueChange={setSegmentoId} disabled={isPending}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Sem segmento</SelectItem>
            {segmentos.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DialogFormShell>
  );
}

// =============================================================================
// DIALOG: EXCLUIR EM MASSA
// =============================================================================

interface ExcluirMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function ExcluirMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: ExcluirMassaDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await actionExcluirContratosEmMassa(selectedIds);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao excluir contratos em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {selectedIds.length} Contrato{selectedIds.length > 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {selectedIds.length} contrato{selectedIds.length > 1 ? 's' : ''}?
            Esta ação não pode ser desfeita e removerá todos os dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
