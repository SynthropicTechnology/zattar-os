'use client';

/**
 * TERCEIROS FEATURE - Componentes de Ações em Massa
 *
 * Barra de ações + dialogs para operações bulk em terceiros selecionados.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
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
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { actionDesativarTerceirosEmMassa } from '../../actions/terceiros-actions';

interface TerceirosBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDesativar: () => void;
}

export function TerceirosBulkActionsBar({
  selectedCount,
  onClearSelection,
  onDesativar,
}: TerceirosBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1 ml-2">
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDesativar}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Desativar
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection} className="ml-auto">
        <X className="mr-1 h-3.5 w-3.5" />
        Limpar
      </Button>
    </div>
  );
}

interface DesativarTerceirosMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function DesativarTerceirosMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: DesativarTerceirosMassaDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDeactivate = async () => {
    setIsPending(true);
    try {
      const result = await actionDesativarTerceirosEmMassa(selectedIds);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao desativar terceiros em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desativar {selectedIds.length} Terceiro{selectedIds.length > 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja desativar {selectedIds.length} terceiro{selectedIds.length > 1 ? 's' : ''}?
            Ficarão como inativos e não aparecerão nas listagens padrão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDeactivate(); }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Desativando...' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
