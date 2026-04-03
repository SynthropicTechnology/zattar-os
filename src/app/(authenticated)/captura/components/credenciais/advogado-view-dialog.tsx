'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { formatOabs } from '@/app/(authenticated)/advogados';

type Props = {
  credencial: Credencial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdvogadoViewDialog({ credencial, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do advogado</DialogTitle>
          <DialogDescription>Informações derivadas da credencial.</DialogDescription>
        </DialogHeader>

        {!credencial ? (
          <div className="text-sm text-muted-foreground">Nenhum advogado selecionado.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{credencial.advogado_nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF {credencial.advogado_cpf} • OAB {formatOabs(credencial.advogado_oabs)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{credencial.tribunal}</Badge>
              <Badge variant="outline">{credencial.grau}</Badge>
              {credencial.active ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Inativa</Badge>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


