'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import type { CampoFaltante } from '@/app/(authenticated)/contratos/services/mapeamento-contrato-input-data';

interface ModalCamposFaltantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camposFaltantes: CampoFaltante[];
  onSubmit: (overrides: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export function ModalCamposFaltantesDialog({
  open,
  onOpenChange,
  camposFaltantes,
  onSubmit,
  isSubmitting = false,
}: ModalCamposFaltantesDialogProps) {
  const [valores, setValores] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) setValores({});
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overrides: Record<string, string> = {};
    for (const campo of camposFaltantes) {
      const v = valores[campo.chave]?.trim();
      if (v) overrides[campo.chave] = v;
    }
    onSubmit(overrides);
  };

  const allFilled = camposFaltantes.every(
    (c) => (valores[c.chave]?.trim().length ?? 0) > 0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            Alguns dados do cliente estão incompletos
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para gerar os PDFs. Esses valores não serão
            salvos no cadastro do cliente — só usados para esta geração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {camposFaltantes.map((campo) => (
            <div key={campo.chave} className="space-y-1">
              <Label htmlFor={campo.chave}>{campo.label}</Label>
              <Input
                id={campo.chave}
                value={valores[campo.chave] ?? ''}
                onChange={(e) =>
                  setValores((v) => ({ ...v, [campo.chave]: e.target.value }))
                }
                disabled={isSubmitting}
                required
              />
              <Text variant="caption" className="text-muted-foreground">
                usado em: {campo.templates.join(', ')}
              </Text>
            </div>
          ))}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!allFilled || isSubmitting}>
            {isSubmitting ? 'Gerando…' : 'Gerar PDFs com esses dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
