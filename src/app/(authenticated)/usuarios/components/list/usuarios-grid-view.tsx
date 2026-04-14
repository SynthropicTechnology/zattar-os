'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from '../shared/usuario-card';
import { DepartmentGroupHeader } from './department-group-header';
import { EmptyState } from '@/components/shared/empty-state';
import type { Usuario } from '../../domain';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  grouped?: boolean;
  onView: (usuario: Usuario) => void;
}

interface CardGridProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  onView: (usuario: Usuario) => void;
}

function CardGrid({ usuarios, lastLoginMap, statsMap, onView }: CardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          lastLoginAt={lastLoginMap?.get(usuario.id) ?? null}
          stats={statsMap?.get(usuario.id)}
          onView={onView}
        />
      ))}
    </div>
  );
}

export function UsuariosGridView({
  usuarios,
  lastLoginMap,
  statsMap,
  grouped = false,
  onView,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum usuário encontrado"
        description="Tente ajustar os filtros ou a busca."
      />
    );
  }

  if (!grouped) {
    return (
      <CardGrid
        usuarios={usuarios}
        lastLoginMap={lastLoginMap}
        statsMap={statsMap}
        onView={onView}
      />
    );
  }

  // Group by cargo.nome
  const groups = new Map<string, Usuario[]>();

  for (const usuario of usuarios) {
    const key = usuario.cargo?.nome ?? 'Sem cargo';
    const existing = groups.get(key) ?? [];
    existing.push(usuario);
    groups.set(key, existing);
  }

  // Sort: "Sem cargo" goes last, everything else alphabetically
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'Sem cargo') return 1;
    if (b === 'Sem cargo') return -1;
    return a.localeCompare(b, 'pt-BR');
  });

  return (
    <div className="space-y-4">
      {sortedKeys.map((cargoNome) => {
        const members = groups.get(cargoNome)!;
        return (
          <DepartmentGroupHeader
            key={cargoNome}
            cargoNome={cargoNome}
            members={members}
            defaultOpen
          >
            <CardGrid
              usuarios={members}
              lastLoginMap={lastLoginMap}
              statsMap={statsMap}
              onView={onView}
            />
          </DepartmentGroupHeader>
        );
      })}
    </div>
  );
}
