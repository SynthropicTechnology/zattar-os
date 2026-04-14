'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getRoleBannerGradient } from '../shared/role-banner';
import { getAvatarUrl } from '../../utils';
import type { Usuario } from '../../domain';

interface DepartmentGroupHeaderProps {
  cargoNome: string;
  members: Usuario[];
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function getInitials(usuario: Usuario): string {
  const name = usuario.nomeExibicao || usuario.nomeCompleto || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MAX_AVATARS = 5;

export function DepartmentGroupHeader({
  cargoNome,
  members,
  defaultOpen = true,
  children,
}: DepartmentGroupHeaderProps) {
  const [open, setOpen] = useState(defaultOpen);

  const gradient = getRoleBannerGradient(cargoNome);
  const visibleMembers = members.slice(0, MAX_AVATARS);
  const overflow = members.length - MAX_AVATARS;

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <GlassPanel depth={1} className="overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150"
        >
          {/* Color bar */}
          <div
            className={cn(
              'w-1 self-stretch rounded-full bg-gradient-to-b shrink-0',
              gradient,
            )}
          />

          {/* Cargo name */}
          <span className="text-sm font-semibold text-foreground truncate">
            {cargoNome}
          </span>

          {/* Member count */}
          <span className="text-xs text-muted-foreground/40 shrink-0">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Avatar stack */}
          <div className="flex items-center -space-x-2 shrink-0">
            {visibleMembers.map((member) => (
              <Avatar
                key={member.id}
                className="size-7 border-2 border-background ring-0"
              >
                <AvatarImage
                  src={getAvatarUrl(member.avatarUrl) ?? undefined}
                  alt={member.nomeExibicao}
                />
                <AvatarFallback className="text-[9px] font-semibold bg-muted/40">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 && (
              <div className="size-7 rounded-full border-2 border-background bg-muted/40 flex items-center justify-center shrink-0 z-10">
                <span className="text-[9px] font-semibold text-muted-foreground/70">
                  +{overflow}
                </span>
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground/40 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </GlassPanel>

      {/* Content */}
      {open && children}
    </div>
  );
}
