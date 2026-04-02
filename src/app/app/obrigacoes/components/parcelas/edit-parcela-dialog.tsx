
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Parcela } from '../../types';
import { formatCurrency } from '../../utils';
import { actionAtualizarParcela, actionRecalcularDistribuicao } from '../../actions/parcelas';

interface EditParcelaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: Parcela | null;
  acordoCondenacaoId: number;
  onSuccess?: () => void;
}

export function EditParcelaDialog({
  open,
  onOpenChange,
  parcela,
  acordoCondenacaoId,
  onSuccess,
}: EditParcelaDialogProps) {
  const [valores, setValores] = useState({
    valorBrutoCreditoPrincipal: 0,
    honorariosSucumbenciais: 0,
    dataVencimento: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (parcela) {
      setValores({
        valorBrutoCreditoPrincipal: parcela.valorBrutoCreditoPrincipal,
        honorariosSucumbenciais: parcela.honorariosSucumbenciais,
        dataVencimento: parcela.dataVencimento,
      });
    }
  }, [parcela]);

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleSave = async () => {
    if (!parcela) return;

    if (valores.valorBrutoCreditoPrincipal <= 0) {
      toast.error('O valor bruto do crédito principal deve ser maior que zero');
      return;
    }

    if (valores.honorariosSucumbenciais < 0) {
      toast.error('Os honorários sucumbenciais não podem ser negativos');
      return;
    }

    if (!valores.dataVencimento) {
      toast.error('A data de vencimento é obrigatória');
      return;
    }

    // Validate that dataVencimento is a valid string in yyyy-MM-dd format
    if (typeof valores.dataVencimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valores.dataVencimento)) {
      toast.error('A data de vencimento está em formato inválido');
      return;
    }

    try {
      setIsSaving(true);

      const updateResponse = await actionAtualizarParcela(parcela.id, {
        valorBrutoCreditoPrincipal: valores.valorBrutoCreditoPrincipal,
        honorariosSucumbenciais: valores.honorariosSucumbenciais,
        dataVencimento: valores.dataVencimento,
        editadoManualmente: true
      });

      if (!updateResponse.success) {
        toast.error(updateResponse.error || 'Erro ao atualizar parcela');
        return;
      }

      // Recalcular apenas se necessário - simplificamos chamando sempre para garantir consistência
      // ou verificando alteração
      const needsRecalcPrincipal = valores.valorBrutoCreditoPrincipal !== parcela.valorBrutoCreditoPrincipal;
      const needsRecalcHonorarios = valores.honorariosSucumbenciais !== parcela.honorariosSucumbenciais;

      if (needsRecalcPrincipal || needsRecalcHonorarios) {
        // Note: actionRecalcularDistribuicao currently recalculates ALL based on updated parcels.
        // It might need refinement to know WHAT to recalculate if params allowed, but service usually handles it.
        // In my service.ts I implemented 'recalcularDistribuicao(acordoId)'.
        await actionRecalcularDistribuicao(acordoCondenacaoId);
      }

      toast.success('Parcela atualizada com sucesso');
      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch {
      toast.error('Erro inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Parcela #{parcela.numeroParcela}</DialogTitle>
          <DialogDescription>
            Altere os valores da parcela. Os valores das parcelas não editadas serão
            redistribuídos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Valor Bruto do Crédito Principal</Label>
            <Input
              type="text"
              value={valores.valorBrutoCreditoPrincipal.toFixed(2)}
              onChange={(e) => setValores((p) => ({ ...p, valorBrutoCreditoPrincipal: parseCurrency(e.target.value) }))}
              disabled={isSaving}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">Atual: {formatCurrency(parcela.valorBrutoCreditoPrincipal)}</p>
          </div>

          <div className="space-y-2">
            <Label>Honorários Sucumbenciais</Label>
            <Input
              type="text"
              value={valores.honorariosSucumbenciais.toFixed(2)}
              onChange={(e) => setValores((p) => ({ ...p, honorariosSucumbenciais: parseCurrency(e.target.value) }))}
              disabled={isSaving}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">Atual: {formatCurrency(parcela.honorariosSucumbenciais)}</p>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <FormDatePicker
              value={valores.dataVencimento || undefined}
              onChange={(v) => setValores((p) => ({ ...p, dataVencimento: v ? format(v, 'yyyy-MM-dd') : '' }))}
              className="max-w-xs"
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 border border-orange-200">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-900">
              <p className="font-medium mb-1">Atenção</p>
              <p>Ao editar manualmente, as demais parcelas serão redistribuídas proporcionalmente.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Save className="mr-2 h-4 w-4 animate-pulse" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
