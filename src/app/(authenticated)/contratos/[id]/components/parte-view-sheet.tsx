'use client';

import * as React from 'react';
import { User, Building2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PAPEL_CONTRATUAL_LABELS } from '@/app/(authenticated)/contratos';
import type { ParteDisplay } from './contrato-partes-card';

interface ParteViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parte: ParteDisplay | null;
}

function getInitials(nome: string): string {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCpfCnpj(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function ParteViewSheet({ open, onOpenChange, parte }: ParteViewSheetProps) {
  if (!parte) return null;

  const isCliente = parte.tipoEntidade === 'cliente';
  const isPF = parte.cpfCnpj ? parte.cpfCnpj.replace(/\D/g, '').length === 11 : true;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback
                className={
                  isCliente
                    ? 'bg-primary/10 text-primary'
                    : 'bg-destructive/10 text-destructive'
                }
              >
                {getInitials(parte.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {parte.nome}
                <Badge variant={isCliente ? 'default' : 'destructive'}>
                  {isCliente ? 'Cliente' : 'Parte Contrária'}
                </Badge>
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                {PAPEL_CONTRATUAL_LABELS[parte.papelContratual] || parte.papelContratual}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            Detalhes da parte no contrato
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Separator />

          {/* Informações básicas */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Informações
            </h4>

            <div className="space-y-3">
              {/* Tipo de pessoa */}
              <div className="flex items-center gap-3 text-sm">
                {isPF ? (
                  <User className="size-4 text-muted-foreground" />
                ) : (
                  <Building2 className="size-4 text-muted-foreground" />
                )}
                <span>{isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
              </div>

              {/* CPF/CNPJ */}
              {parte.cpfCnpj && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-4 text-center text-xs">
                    {isPF ? 'CPF' : 'CNPJ'}
                  </span>
                  <span className="font-mono">{formatCpfCnpj(parte.cpfCnpj)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Nota sobre dados adicionais */}
          <div className="text-sm text-muted-foreground text-center py-4">
            <p>Para ver informações completas de contato e endereço,</p>
            <p>acesse a página da {isCliente ? 'cliente' : 'parte contrária'}.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
