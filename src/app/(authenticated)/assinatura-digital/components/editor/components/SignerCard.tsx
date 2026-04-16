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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * SignerCard — Card glass com dot colorido + avatar.
 *
 * Alinhado ao POC novo-documento (Step 2):
 * - Estado ativo: border-primary/40 com glass-kpi mais opaco
 * - Dot colorido (signer.cor) + shadow-glow para identificar
 * - Avatar com iniciais, colorido pela `signer.cor` (NÃO bg inteiro)
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
        'group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
        'border backdrop-blur-md',
        isActive
          ? 'glass-kpi border-primary/40 bg-primary/5 shadow-sm'
          : 'glass-kpi border-border/40 bg-card/55 hover:border-border/70 hover:bg-card/75',
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
      {/* Status dot com glow na cor do signer */}
      <span
        aria-hidden="true"
        className="size-2 rounded-full shrink-0"
        style={{
          backgroundColor: signer.cor,
          boxShadow: `0 0 6px ${signer.cor}`,
        }}
      />

      {/* Avatar com iniciais */}
      <div
        className="flex items-center justify-center size-8 rounded-full shrink-0 font-semibold text-[11px] text-white"
        style={{ backgroundColor: signer.cor }}
      >
        {getInitials(signer.nome)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {signer.nome}
          {isCurrentUser && ' (Você)'}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {signer.email}
        </p>
      </div>

      {/* Actions — visíveis on hover (ou sempre no ativo) */}
      <div
        className={cn(
          'flex items-center gap-0.5 transition-opacity',
          isActive
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
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
            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
    </div>
  );
});

export default SignerCard;
