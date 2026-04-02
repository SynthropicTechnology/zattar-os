'use client';

import * as React from 'react';
import { Trash2, DollarSign, Download, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

import { AcordoComParcelas } from '../../domain';
import { actionDeletarAcordo } from '../../actions';

interface ObrigacoesBulkActionsProps {
  selectedRows: AcordoComParcelas[];
  onSuccess?: () => void;
}

export function ObrigacoesBulkActions({
  selectedRows,
  onSuccess,
}: ObrigacoesBulkActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const promises = selectedRows.map((row) => actionDeletarAcordo(row.id));
        await Promise.all(promises);
        
        toast.success(`${selectedRows.length} obrigações excluídas com sucesso`);
        setIsDeleteOpen(false);
        onSuccess?.();
      } catch (error) {
        toast.error('Erro ao excluir obrigações');
        console.error(error);
      }
    });
  };

  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto h-8 lg:flex">
            Ações em Lote ({selectedRows.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem disabled>
            <DollarSign className="mr-2 h-4 w-4" />
            Marcar como Pago
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar Financeiro
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Download className="mr-2 h-4 w-4" />
            Exportar Selecionados
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Selecionados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente{' '}
              <span className="font-medium">{selectedRows.length}</span> obrigações
              selecionadas e todas as suas parcelas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
