'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, MoreHorizontal, Trash2, User, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Contrato, ResponsavelDetalhado } from '@/app/(authenticated)/contratos';
import {
  formatarStatusContrato,
  formatarTipoContrato,
  getStatusVariant,
  TIPO_COBRANCA_LABELS,
  ContratoDeleteDialog,
} from '@/app/(authenticated)/contratos';

function getInitials(nome: string): string {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return '-';
  }
}

function getParteContrariaNome(contrato: Contrato): string | null {
  const partesContrarias = contrato.partes.filter(
    (p) => p.tipoEntidade === 'parte_contraria'
  );
  if (partesContrarias.length === 0) return null;
  const primeira = partesContrarias[0].nomeSnapshot || 'Parte Contrária';
  if (partesContrarias.length === 1) return primeira;
  return `${primeira} e outros (${partesContrarias.length})`;
}

interface ContratoDetalhesHeaderProps {
  contrato: Contrato;
  clienteNome: string;
  responsavel?: ResponsavelDetalhado | null;
  onEdit?: () => void;
}

export function ContratoDetalhesHeader({
  contrato,
  clienteNome,
  responsavel,
  onEdit,
}: ContratoDetalhesHeaderProps) {
  const router = useRouter();
  const statusLabel = formatarStatusContrato(contrato.status);
  const tipoContratoLabel = formatarTipoContrato(contrato.tipoContrato);
  const tipoCobrancaLabel = TIPO_COBRANCA_LABELS[contrato.tipoCobranca] || contrato.tipoCobranca;
  const statusVariant = getStatusVariant(contrato.status);
  const parteContrariaNome = getParteContrariaNome(contrato);

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {/* Botao voltar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app/contratos')}
            className="shrink-0 -ml-2 -mt-1"
            title="Voltar para Contratos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar do cliente */}
          <Avatar className="h-14 w-14 shrink-0 border-2 border-muted">
            <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
              {getInitials(clienteNome)}
            </AvatarFallback>
          </Avatar>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight font-heading truncate">
                  {clienteNome}
                </h1>
                {parteContrariaNome && (
                  <p className="text-sm font-medium text-foreground/70 mt-0.5">
                    vs. {parteContrariaNome}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Contrato #{contrato.id} &middot; {tipoContratoLabel} &middot; {tipoCobrancaLabel}
                </p>
              </div>

              {/* Acoes */}
              <div className="flex items-center gap-2 shrink-0">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="size-4 mr-1.5" />
                    Editar
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/app/clientes/${contrato.clienteId}`}>
                        Ver Cliente
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Excluir Contrato
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Badge de status */}
            <div className="mt-3">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>

            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {responsavel && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Responsável: {responsavel.nome}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Criado: {formatDate(contrato.createdAt)}</span>
              </div>
              {contrato.updatedAt && contrato.updatedAt !== contrato.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Atualizado: {formatDate(contrato.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ContratoDeleteDialog
        contratoId={contrato.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push('/app/contratos')}
      />
    </>
  );
}
