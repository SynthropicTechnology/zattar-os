'use client';

import * as React from 'react';
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
import { CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  expiraEm: string;
  reaproveitado: boolean;
}

export function ModalLinkAssinaturaDialog({
  open,
  onOpenChange,
  token,
  expiraEm,
  reaproveitado,
}: Props) {
  const urlAbsoluta =
    typeof window !== 'undefined'
      ? new URL(`/assinatura-pacote/${token}`, window.location.origin).toString()
      : `/assinatura-pacote/${token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(urlAbsoluta);
    toast.success('Link copiado');
  };

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(expiraEm),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            {reaproveitado ? 'Link existente reutilizado' : 'Documentos prontos para assinatura'}
          </DialogTitle>
          <DialogDescription>
            {reaproveitado
              ? 'Já existe um pacote ativo para este contrato. Use o link abaixo.'
              : 'Envie o link abaixo para o cliente assinar os documentos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={urlAbsoluta} />
            <Button size="sm" onClick={handleCopy}>
              <Copy className="size-4 mr-1" />
              Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Expira em: <span className="font-medium">{dataFormatada}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
