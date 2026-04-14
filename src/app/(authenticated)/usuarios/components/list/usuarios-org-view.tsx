'use client';

import * as React from 'react';
import { GitBranch, ZoomIn, ZoomOut } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '../../utils';
import type { Usuario } from '../../domain';

// ─── Hierarchy ──────────────────────────────────────────────────────────────

function getCargoLevel(cargoNome: string | null | undefined): number {
  const nome = cargoNome?.toLowerCase().trim() ?? '';
  if (nome === 'diretor') return 0;
  if (nome === 'advogado' || nome === 'advogada') return 1;
  if (nome === 'secretário' || nome === 'secretária') return 2;
  if (nome === 'estagiário' || nome === 'estagiária') return 3;
  if (!cargoNome) return 99;
  return 50;
}

function getInitials(usuario: Usuario): string {
  const name = usuario.nomeExibicao ?? usuario.nomeCompleto ?? '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── OrgNode ────────────────────────────────────────────────────────────────

interface OrgNodeProps {
  usuario: Usuario;
  isRoot?: boolean;
  onClick: (usuario: Usuario) => void;
}

function OrgNode({ usuario, isRoot, onClick }: OrgNodeProps) {
  const displayName = usuario.nomeExibicao ?? usuario.nomeCompleto;
  const cargoNome = usuario.cargo?.nome;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(usuario);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver perfil de ${displayName}`}
      onClick={() => onClick(usuario)}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer',
        'transition-all duration-200 select-none',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'min-w-25 max-w-30',
        isRoot
          ? 'bg-primary/6 border-primary/20'
          : 'glass-widget border-border/20',
      )}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage
          src={getAvatarUrl(usuario.avatarUrl) ?? undefined}
          alt={displayName}
        />
        <AvatarFallback className="text-xs font-medium">
          {getInitials(usuario)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center text-center min-w-0 w-full">
        <span className="text-[12px] font-semibold leading-tight truncate w-full text-center">
          {displayName}
        </span>
        {cargoNome && (
          <span className="text-[10px] text-muted-foreground/50 mt-0.5 truncate w-full text-center">
            {cargoNome}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface UsuariosOrgViewProps {
  usuarios: Usuario[];
  onView: (usuario: Usuario) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UsuariosOrgView({ usuarios, onView }: UsuariosOrgViewProps) {
  const [zoom, setZoom] = React.useState(100);

  const handleZoomIn = () => setZoom((z) => Math.min(150, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const handleZoomReset = () => setZoom(100);

  // Filter active users only
  const activeUsuarios = React.useMemo(
    () => usuarios.filter((u) => u.ativo),
    [usuarios],
  );

  // Group by cargo, sorted by hierarchy level
  const groups = React.useMemo(() => {
    const map = new Map<string, { level: number; members: Usuario[] }>();

    for (const usuario of activeUsuarios) {
      const key = usuario.cargo?.nome ?? 'Sem cargo';
      const level = getCargoLevel(usuario.cargo?.nome);
      const existing = map.get(key);
      if (existing) {
        existing.members.push(usuario);
      } else {
        map.set(key, { level, members: [usuario] });
      }
    }

    // Sort by level ascending (lower level = higher in org)
    return Array.from(map.entries()).sort(([, a], [, b]) => a.level - b.level);
  }, [activeUsuarios]);

  if (activeUsuarios.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Sem hierarquia"
        description="Cadastre usuários ativos para visualizar o organograma."
      />
    );
  }

  return (
    <GlassPanel depth={1} className="p-6 overflow-x-auto relative">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={handleZoomReset}
          className="text-[11px] font-medium tabular-nums text-muted-foreground/60 hover:text-foreground transition-colors min-w-10nter"
          aria-label="Redefinir zoom para 100%"
        >
          {zoom}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleZoomIn}
          disabled={zoom >= 150}
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      {/* Tree container with zoom */}
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
        className="transition-transform duration-200"
      >
        <div className="flex flex-col items-center gap-0 py-2">
          {groups.map(([cargoNome, { level, members }], groupIndex) => {
            const isRoot = level === 0;
            return (
              <React.Fragment key={cargoNome}>
                {/* Vertical connector between levels */}
                {groupIndex > 0 && (
                  <div className="w-0.5 h-7 bg-border/15 shrink-0" />
                )}

                {/* Level */}
                <div className="flex flex-col items-center gap-2">
                  {/* Level label */}
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">
                    {cargoNome}
                  </span>

                  {/* Members row */}
                  <div className="flex flex-row flex-wrap justify-center gap-2">
                    {members.map((usuario) => (
                      <OrgNode
                        key={usuario.id}
                        usuario={usuario}
                        isRoot={isRoot}
                        onClick={onView}
                      />
                    ))}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}
