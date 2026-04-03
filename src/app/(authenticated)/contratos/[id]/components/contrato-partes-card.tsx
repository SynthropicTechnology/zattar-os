'use client';

import * as React from 'react';
import { Eye, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { ContratoParte } from '@/app/(authenticated)/contratos';
import { PAPEL_CONTRATUAL_LABELS } from '@/app/(authenticated)/contratos';

interface ParteDisplay {
  id: string;
  tipoEntidade: 'cliente' | 'parte_contraria';
  entidadeId: number;
  nome: string;
  cpfCnpj: string | null;
  papelContratual: 'autora' | 're';
}

interface ContratoPartesCardProps {
  partes: ContratoParte[];
  onViewParte?: (parte: ParteDisplay) => void;
}

function getInitials(nome: string): string {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCpfCnpj(value: string | null): string | null {
  if (!value) return null;
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function ContratoPartesCard({ partes, onViewParte }: ContratoPartesCardProps) {
  // Convert ContratoParte[] to ParteDisplay[]
  const partesDisplay: ParteDisplay[] = partes.map((p) => ({
    id: `${p.tipoEntidade}-${p.entidadeId}`,
    tipoEntidade: p.tipoEntidade,
    entidadeId: p.entidadeId,
    nome: p.nomeSnapshot || `${p.tipoEntidade === 'cliente' ? 'Cliente' : 'Parte Contrária'} #${p.entidadeId}`,
    cpfCnpj: p.cpfCnpjSnapshot,
    papelContratual: p.papelContratual,
  }));

  const isEmpty = partesDisplay.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Users className="size-4" />
          Partes do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="size-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma parte registrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {partesDisplay.map((parte) => (
              <div key={parte.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback
                      className={
                        parte.tipoEntidade === 'cliente'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }
                    >
                      {getInitials(parte.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {parte.nome}
                      <Badge
                        variant={parte.tipoEntidade === 'cliente' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {parte.tipoEntidade === 'cliente' ? 'Cliente' : 'Parte Contrária'}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2">
                      {parte.cpfCnpj && (
                        <span>{formatCpfCnpj(parte.cpfCnpj)}</span>
                      )}
                      <span className="text-muted-foreground/60">
                        ({PAPEL_CONTRATUAL_LABELS[parte.papelContratual] || parte.papelContratual})
                      </span>
                    </div>
                  </div>
                </div>
                {onViewParte && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewParte(parte)}
                    title="Ver detalhes"
                  >
                    <Eye className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { ParteDisplay };
