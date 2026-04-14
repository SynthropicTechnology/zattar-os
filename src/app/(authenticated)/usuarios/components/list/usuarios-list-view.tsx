'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, RotateCcw, ShieldAlert } from 'lucide-react';
import { DataShell } from '@/components/shared/data-shell/data-shell';
import { DataTable } from '@/components/shared/data-shell/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab } from '../../utils';
import { UserStatusDot, getStatusFromLastLogin } from '../shared/user-status-dot';
import { calcularCompleteness, getCompletenessColor } from '../shared/completeness-utils';
import type { Usuario } from '../../domain';

interface UsuariosListViewProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  onView: (usuario: Usuario) => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsuariosListView({
  usuarios,
  lastLoginMap,
  statsMap,
  onView,
}: UsuariosListViewProps) {
  const columns: ColumnDef<Usuario>[] = React.useMemo(
    () => [
      // 1. Usuário
      {
        accessorKey: 'nomeCompleto',
        header: 'Usuário',
        cell: ({ row }) => {
          const usuario = row.original;
          const lastLoginAt = lastLoginMap?.get(usuario.id) ?? null;
          const status = getStatusFromLastLogin(lastLoginAt);
          const displayName = usuario.nomeExibicao ?? usuario.nomeCompleto;
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <Avatar style={{ width: 34, height: 34 }}>
                  <AvatarImage
                    src={getAvatarUrl(usuario.avatarUrl) ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-[11px] font-medium">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <UserStatusDot
                  status={status}
                  size="sm"
                  className="absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold truncate">
                    {usuario.nomeCompleto}
                  </span>
                  {usuario.isSuperAdmin && (
                    <ShieldAlert className="size-3 text-destructive shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground/50 truncate">
                  {usuario.emailCorporativo}
                </span>
              </div>
            </div>
          );
        },
        meta: { align: 'left' },
      },
      // 2. Cargo
      {
        id: 'cargo',
        accessorFn: (u) => u.cargo?.nome,
        header: 'Cargo',
        cell: ({ getValue }) => {
          const nome = getValue<string | undefined>();
          if (!nome) return <span className="text-muted-foreground/40">—</span>;
          return (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/8 text-muted-foreground">
              {nome}
            </span>
          );
        },
        meta: { align: 'left' },
      },
      // 3. OAB
      {
        id: 'oab',
        header: 'OAB',
        cell: ({ row }) => {
          const usuario = row.original;
          const hasOab = Boolean(usuario.oab?.trim());
          if (!hasOab) return <span className="text-muted-foreground/40">—</span>;
          return (
            <span className="px-1.5 py-0.5 rounded bg-info/8 text-[11px] text-info/70">
              ⚖ {formatarOab(usuario.oab, usuario.ufOab)}
            </span>
          );
        },
        meta: { align: 'left' },
      },
      // 4. Status
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ getValue }) => {
          const ativo = getValue<boolean>();
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-semibold',
                ativo
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          );
        },
        meta: { align: 'left' },
      },
      // 5. Processos
      {
        id: 'processos',
        header: 'Processos',
        cell: ({ row }) => {
          const stats = statsMap?.get(row.original.id);
          if (!stats) return <span className="text-muted-foreground/40">—</span>;
          return (
            <span className="tabular-nums font-semibold text-sm">
              {stats.processos}
            </span>
          );
        },
        meta: { align: 'left' },
      },
      // 6. Perfil (completeness)
      {
        id: 'perfil',
        header: 'Perfil',
        cell: ({ row }) => {
          const { score } = calcularCompleteness(row.original);
          const color = getCompletenessColor(score);
          const barColorClass =
            color === 'success'
              ? 'bg-success'
              : color === 'warning'
                ? 'bg-warning'
                : 'bg-destructive';
          const textColorClass =
            color === 'success'
              ? 'text-success'
              : color === 'warning'
                ? 'text-warning'
                : 'text-destructive';
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 rounded-full bg-muted/20 overflow-hidden shrink-0">
                <div
                  className={cn('h-full rounded-full', barColorClass)}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={cn('text-[11px] font-medium tabular-nums', textColorClass)}>
                {score}%
              </span>
            </div>
          );
        },
        meta: { align: 'left' },
      },
      // 7. Ações
      {
        id: 'acoes',
        header: '',
        size: 80,
        cell: ({ row }) => {
          const usuario = row.original;
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(usuario);
                }}
                aria-label="Ver usuário"
              >
                <Eye className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => e.stopPropagation()}
                aria-label={usuario.ativo ? 'Editar usuário' : 'Reativar usuário'}
              >
                {usuario.ativo ? (
                  <Pencil className="size-3.5" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
              </Button>
            </div>
          );
        },
        meta: { align: 'left' },
      },
    ],
    [lastLoginMap, statsMap, onView],
  );

  return (
    <DataShell>
      <DataTable
        columns={columns}
        data={usuarios}
        density="compact"
        onRowClick={onView}
        options={{
          meta: {
            getRowClassName: (row: Usuario) =>
              !row.ativo ? 'opacity-50' : '',
          },
        }}
      />
    </DataShell>
  );
}
