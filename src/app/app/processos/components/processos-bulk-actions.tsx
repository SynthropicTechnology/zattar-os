'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { actionAtribuirResponsavelEmLote } from '../actions';
import type { ProcessoUnificado } from '../types';

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ProcessosBulkActionsProps {
  selectedRows: ProcessoUnificado[];
  usuarios: Usuario[];
  onSuccess: () => void;
}

export function ProcessosBulkActions({
  selectedRows,
  usuarios,
  onSuccess,
}: ProcessosBulkActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [isPending, startTransition] = React.useTransition();

  const selectedCount = selectedRows.length;

  const handleAtribuir = () => {
    startTransition(async () => {
      try {
        const ids = selectedRows.map((p) => p.id);
        const novoResponsavelId =
          responsavelId && responsavelId !== 'null'
            ? Number(responsavelId)
            : null;

        const result = await actionAtribuirResponsavelEmLote(ids, novoResponsavelId);

        if (result.success) {
          toast.success(result.message);
          setIsDialogOpen(false);
          setResponsavelId('');
          onSuccess();
        } else {
          toast.error(result.message || 'Erro ao atribuir responsável');
        }
      } catch (error) {
        toast.error('Erro ao atribuir responsável');
        console.error(error);
      }
    });
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setIsDialogOpen(true)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Atribuir Responsável ({selectedCount})
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atribuir Responsável em Lote</DialogTitle>
            <DialogDescription>
              Selecione o responsável para {selectedCount} processo(s)
              selecionado(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel-lote">Responsável</Label>
              <Select
                value={responsavelId || 'null'}
                onValueChange={setResponsavelId}
                disabled={isPending}
              >
                <SelectTrigger id="responsavel-lote" className="w-full">
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
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleAtribuir} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
