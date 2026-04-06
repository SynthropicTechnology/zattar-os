'use client';

/**
 * CONTRATOS FEATURE - Definição de Colunas
 *
 * Colunas da tabela de contratos no padrão DataShell/TanStack Table.
 */

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/shared/data-shell';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Pencil, FileText, Trash2 } from 'lucide-react';
import type { Contrato } from '../domain';
import type { ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import { formatarData } from '../utils';
import { ContratoAlterarResponsavelDialog } from './contrato-alterar-responsavel-dialog';

// =============================================================================
// TIPOS PARA TABLE META
// =============================================================================

export interface ContratosTableMeta {
  usuarios?: ClienteInfo[];
  onSuccessAction?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// =============================================================================
// RESPONSÁVEL CELL (Edição Inline)
// =============================================================================

function ResponsavelCell({
  contrato,
  usuariosMap,
  usuarios,
  onSuccessAction,
}: {
  contrato: Contrato;
  usuariosMap: Map<number, ClienteInfo>;
  usuarios: ClienteInfo[];
  onSuccessAction?: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const usuarioResp = contrato.responsavelId
    ? usuariosMap.get(contrato.responsavelId) ?? null
    : null;
  const nome = usuarioResp?.nome ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center justify-start gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={nome ? `Clique para alterar responsável: ${nome}` : 'Clique para atribuir responsável'}
      >
        {nome ? (
          <>
            <Avatar size="sm">
              <AvatarImage src={usuarioResp?.avatarUrl || undefined} alt={nome} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(nome)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{nome}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
      </button>

      <ContratoAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contrato={contrato}
        usuarios={usuarios}
        onSuccess={() => {
          onSuccessAction?.();
        }}
      />
    </>
  );
}

// =============================================================================
// FACTORY FUNCTION DE COLUNAS
// =============================================================================

export function getContratosColumns(
  clientesMap: Map<number, ClienteInfo>,
  partesContrariasMap: Map<number, ClienteInfo>,
  usuariosMap: Map<number, ClienteInfo>,
  segmentosMap: Map<number, { nome: string }>,
  onEdit: (contrato: Contrato) => void,
  onGerarPeca: (contrato: Contrato) => void,
  onDelete: (contrato: Contrato) => void
): ColumnDef<Contrato>[] {
  const getParteNome = (parte: { tipoEntidade: string; entidadeId: number; nomeSnapshot?: string | null }) => {
    if (parte.nomeSnapshot) return parte.nomeSnapshot;
    if (parte.tipoEntidade === 'cliente') {
      return clientesMap.get(parte.entidadeId)?.nome || `Cliente #${parte.entidadeId}`;
    }
    if (parte.tipoEntidade === 'parte_contraria') {
      return partesContrariasMap.get(parte.entidadeId)?.nome || `Parte Contrária #${parte.entidadeId}`;
    }
    return `Entidade #${parte.entidadeId}`;
  };

  return [
    {
      accessorKey: 'cadastradoEm',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cadastro" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Cadastro',
      },
      size: 120,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">{formatarData(contrato.cadastradoEm)}</span>
        );
      },
    },
    {
      id: 'estagio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estágio" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Estágio',
      },
      size: 170,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <SemanticBadge category="status_contrato" value={contrato.status}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
        );
      },
    },
    {
      id: 'partes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Partes" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Partes',
      },
      size: 360,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const partesAutoras = (contrato.partes ?? []).filter((p) => p.papelContratual === 'autora');
        const partesRe = (contrato.partes ?? []).filter((p) => p.papelContratual === 're');

        const clienteNome = clientesMap.get(contrato.clienteId)?.nome || `Cliente #${contrato.clienteId}`;

        // Fallback importante: alguns contratos legados/importados podem não ter o cliente registrado em `contrato_partes`.
        // Nesse caso, usamos `cliente_id` como fonte de verdade para exibir o nome do cliente.
        const autoraNome = (() => {
          if (contrato.papelClienteNoContrato === 'autora') {
            return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : clienteNome;
          }
          return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
        })();

        const reNome = (() => {
          if (contrato.papelClienteNoContrato === 're') {
            return partesRe.length > 0 ? getParteNome(partesRe[0]) : clienteNome;
          }
          return partesRe.length > 0 ? getParteNome(partesRe[0]) : null;
        })();
        const segmentoNome = contrato.segmentoId
          ? segmentosMap.get(contrato.segmentoId)?.nome
          : null;

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,23.75rem)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="text-xs">
                {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
              </SemanticBadge>
              <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="text-xs">
                {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
              </SemanticBadge>
              {segmentoNome && (
                <AppBadge variant="outline" className="text-xs px-2 py-0.5">
                  {segmentoNome}
                </AppBadge>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <ParteBadge polo="ATIVO" className="text-xs">
                  {autoraNome?.toUpperCase() || '-'}
                  {autoraNome && partesAutoras.length > 1 && ` e outros (${partesAutoras.length})`}
                </ParteBadge>
              </div>
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <ParteBadge polo="PASSIVO" className="text-xs">
                  {reNome?.toUpperCase() || '-'}
                  {reNome && partesRe.length > 1 && ` e outros (${partesRe.length})`}
                </ParteBadge>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'processos',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processos" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Processos',
      },
      size: 220,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const processos = contrato.processos ?? [];

        if (!processos.length) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        const shown = processos.slice(0, 2);
        const remaining = processos.length - shown.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[min(92vw,13.75rem)] min-w-0">
            {shown.map((p) => {
              const numero = p.processo?.numeroProcesso ?? null;
              const label = numero || `Processo #${p.processoId}`;
              return (
                <Link key={p.id} href={`/processos/${p.processoId}`} className="inline-flex min-w-0 max-w-full">
                  <AppBadge variant="outline" className="text-xs px-2 py-0 break-all">
                    {label}
                  </AppBadge>
                </Link>
              );
            })}
            {remaining > 0 ? (
              <AppBadge variant="outline" className="text-xs px-2 py-0 text-muted-foreground">
                +{remaining}
              </AppBadge>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'responsavelId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Responsável',
      },
      size: 180,
      enableSorting: true,
      cell: ({ row, table }) => {
        const contrato = row.original;
        const meta = table.options.meta as ContratosTableMeta | undefined;
        const usuarios = meta?.usuarios ?? [];
        const onSuccessAction = meta?.onSuccessAction;

        return (
          <ResponsavelCell
            contrato={contrato}
            usuariosMap={usuariosMap}
            usuarios={usuarios}
            onSuccessAction={onSuccessAction}
          />
        );
      },
    },
    {
      accessorKey: 'observacoes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Observações" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Observações',
      },
      size: 200,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground truncate block max-w-50">
            {contrato.observacoes || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Criado em',
      },
      size: 150,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {formatarData(contrato.createdAt)}
          </span>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Atualizado em" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Atualizado em',
      },
      size: 150,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {formatarData(contrato.updatedAt)}
          </span>
        );
      },
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'ID',
      },
      size: 80,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm font-medium text-muted-foreground">
            #{contrato.id}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      meta: {
        align: 'left',
        headerLabel: 'Ações',
      },
      size: 140,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Visualizar" className="h-8 w-8" asChild>
                  <Link href={`/app/contratos/${contrato.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar</TooltipContent>
            </Tooltip>
            {/* Botão de Excluir */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon" aria-label="Excluir"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(contrato)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Editar" className="h-8 w-8" onClick={() => onEdit(contrato)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Gerar peça" className="h-8 w-8" onClick={() => onGerarPeca(contrato)}>
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Gerar Peça</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gerar Peça</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
