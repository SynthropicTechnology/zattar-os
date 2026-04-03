'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type {
  Advogado,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  OabEntry,
} from '@/app/(authenticated)/advogados';
import { UFS_BRASIL } from '@/app/(authenticated)/advogados';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  advogado: Advogado | null;
  mode: 'create' | 'edit';
  onSaveAction: (data: CriarAdvogadoParams | AtualizarAdvogadoParams) => Promise<void>;
};

interface FormData {
  nome_completo: string;
  cpf: string;
  oabs: OabEntry[];
}

export function AdvogadoDialog({
  open,
  onOpenChangeAction,
  advogado,
  mode,
  onSaveAction,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome_completo: '',
    cpf: '',
    oabs: [{ numero: '', uf: '' }],
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (advogado && mode === 'edit') {
        setFormData({
          nome_completo: advogado.nome_completo,
          cpf: advogado.cpf,
          oabs: advogado.oabs.length > 0 ? advogado.oabs : [{ numero: '', uf: '' }],
        });
      } else {
        setFormData({
          nome_completo: '',
          cpf: '',
          oabs: [{ numero: '', uf: '' }],
        });
      }
    }
  }, [open, advogado, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Filtrar OABs vazias
      const oabsValidas = formData.oabs.filter(
        (oab) => oab.numero.trim() !== '' && oab.uf.trim() !== ''
      );

      if (oabsValidas.length === 0) {
        toast.error('Pelo menos uma OAB é obrigatória');
        setIsSaving(false);
        return;
      }

      await onSaveAction({
        nome_completo: formData.nome_completo,
        cpf: formData.cpf,
        oabs: oabsValidas,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar advogado');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCPF = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '').slice(0, 11);
    // Format as 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  // Funções para gerenciar múltiplas OABs
  const addOab = () => {
    setFormData({
      ...formData,
      oabs: [...formData.oabs, { numero: '', uf: '' }],
    });
  };

  const removeOab = (index: number) => {
    if (formData.oabs.length > 1) {
      setFormData({
        ...formData,
        oabs: formData.oabs.filter((_, i) => i !== index),
      });
    }
  };

  const updateOab = (index: number, field: 'numero' | 'uf', value: string) => {
    const newOabs = [...formData.oabs];
    newOabs[index] = { ...newOabs[index], [field]: value };
    setFormData({ ...formData, oabs: newOabs });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-137.5">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Novo Advogado' : 'Editar Advogado'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Cadastre um novo advogado para gerenciar suas credenciais de acesso aos tribunais.'
                : 'Atualize os dados do advogado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Nome completo do advogado"
                required
                minLength={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                required
                maxLength={14}
              />
            </div>

            {/* Seção de OABs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>OABs *</Label>
                <span className="text-xs text-muted-foreground">
                  Adicione as inscrições na OAB por estado
                </span>
              </div>

              {formData.oabs.map((oab, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      value={oab.numero}
                      onChange={(e) => updateOab(index, 'numero', e.target.value)}
                      placeholder="Número OAB"
                      required={index === 0}
                    />
                  </div>
                  <div className="w-24">
                    <Select
                      value={oab.uf}
                      onValueChange={(value) => updateOab(index, 'uf', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS_BRASIL.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.oabs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOab(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOab}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar OAB
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Cadastrar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
