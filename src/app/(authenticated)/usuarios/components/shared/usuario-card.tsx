
'use client';

import * as React from 'react';
import type { Usuario } from '../../domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldAlert } from 'lucide-react';
import {
  formatarOab,
  formatarTelefone,
  formatarCpf,
  getAvatarUrl,
} from '../../utils';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UsuarioCardProps {
  usuario: Usuario;
  onView: (usuario: Usuario) => void;
}

export function UsuarioCard({ usuario, onView }: UsuarioCardProps) {
  // Verifica se deve exibir OAB (apenas para Advogado e Diretor)
  const cargoNome = usuario.cargo?.nome?.toLowerCase();
  const temOab = Boolean(usuario.oab?.trim());
  const deveExibirOab = (cargoNome === 'advogado' || cargoNome === 'diretor') && temOab;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView(usuario)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(usuario);
        }
      }}
      className="cursor-pointer flex flex-col h-full min-h-48 p-3 sm:p-4 gap-3 sm:gap-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      <CardHeader className="px-0 py-0 gap-1.5">
        <div className="flex items-center gap-2.5">
          <Avatar size="lg">
            <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(usuario.nomeExibicao || usuario.nomeCompleto)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold leading-tight truncate">
                {usuario.nomeCompleto}
              </CardTitle>
              {usuario.isSuperAdmin && (
                <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {usuario.emailCorporativo}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 text-sm px-0">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">CPF:</span>
          <span className="text-xs font-medium">
            {formatarCpf(usuario.cpf)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Telefone:</span>
          <span className="text-xs font-medium">
            {formatarTelefone(usuario.telefone)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Cargo:</span>
          <span className="text-xs font-medium truncate" title={usuario.cargo?.nome || '-'}>
            {usuario.cargo?.nome || '-'}
          </span>
        </div>

        {deveExibirOab && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">OAB:</span>
            <span className="text-xs font-medium">
              {formatarOab(usuario.oab, usuario.ufOab)}
            </span>
          </div>
        )}
      </CardContent>

    </Card>
  );
}
