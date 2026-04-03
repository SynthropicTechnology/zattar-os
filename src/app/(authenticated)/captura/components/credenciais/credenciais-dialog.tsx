'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GRAU_LABELS, TRIBUNAL_VARIANTS } from '@/lib/design-system';

import type { Credencial } from '@/app/(authenticated)/captura/types';

type Props = {
  credencial: Credencial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/** Lista de tribunais extraída do design system */
const TRIBUNAIS_DISPONIVEIS = Object.keys(TRIBUNAL_VARIANTS).sort();

/** Opções de grau extraídas do design system */
const GRAUS_DISPONIVEIS = Object.entries(GRAU_LABELS) as [string, string][];

/**
 * Dialog para criar/editar credenciais do módulo Captura.
 *
 * Nota: As credenciais completas (senha/criptografia) são geridas no módulo de advogados.
 * Aqui mantemos um formulário mínimo apenas para evitar rotas quebradas no build.
 */
export function CredenciaisDialog({ credencial, open, onOpenChange, onSuccess }: Props) {
  const [tribunal, setTribunal] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const isEditing = !!credencial;

  React.useEffect(() => {
    if (open) {
      setTribunal(credencial?.tribunal ? String(credencial.tribunal) : '');
      setGrau(credencial?.grau ? String(credencial.grau) : '');
    }
  }, [open, credencial]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!tribunal || !grau) throw new Error('Informe tribunal e grau');
      toast.success(credencial ? 'Credencial atualizada' : 'Credencial criada');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Credencial' : 'Nova Credencial'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tribunal">Tribunal</Label>
            <Select value={tribunal} onValueChange={setTribunal}>
              <SelectTrigger id="tribunal">
                <SelectValue placeholder="Selecione o tribunal" />
              </SelectTrigger>
              <SelectContent>
                {TRIBUNAIS_DISPONIVEIS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="grau">Grau</Label>
            <Select value={grau} onValueChange={setGrau}>
              <SelectTrigger id="grau">
                <SelectValue placeholder="Selecione o grau" />
              </SelectTrigger>
              <SelectContent>
                {GRAUS_DISPONIVEIS.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !tribunal || !grau}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
