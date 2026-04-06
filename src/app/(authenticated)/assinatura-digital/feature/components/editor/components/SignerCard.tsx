'use client';

import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Signatario } from '../types';

interface SignerCardProps {
  signer: Signatario;
  isActive: boolean;
  isCurrentUser: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Get initials from a name (first 2 letters uppercase)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * SignerCard - Individual signer card in the sidebar
 *
 * States:
 * - ACTIVE: bg-primary with white text (selected signer)
 * - INACTIVE: bg-background with hover state
 *
 * Uses design system tokens: bg-primary, text-primary-foreground, bg-accent
 */
const SignerCard = memo(function SignerCard({
  signer,
  isActive,
  isCurrentUser,
  onSelect,
  onEdit,
  onDelete,
}: SignerCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 border',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-md ring-1 ring-primary ring-offset-1'
          : 'bg-background hover:bg-muted/50 border-input hover:border-muted-foreground/30 shadow-sm'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Selecionar signatário ${signer.nome}`}
      aria-pressed={isActive}
    >
      {/* Avatar with initials */}
      <div
        className={cn(
          'flex items-center justify-center size-10 rounded-full shrink-0 font-semibold text-sm',
          isActive
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'text-primary-foreground'
        )}
        style={{
          backgroundColor: isActive ? undefined : signer.cor,
        }}
      >
        {getInitials(signer.nome)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm font-medium truncate',
            isActive ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {signer.nome}
            {isCurrentUser && ' (Você)'}
          </p>
        </div>
        <p className={cn(
          'text-xs truncate',
          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}>
          {signer.email}
        </p>
      </div>

      {/* Actions - visible on hover (only when not active for better contrast) */}
      {!isActive && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Editar signatário ${signer.nome}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          {!isCurrentUser && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Remover signatário ${signer.nome}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

export default SignerCard;
