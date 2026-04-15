'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PermissionToggleProps {
  operacao: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  changed?: boolean; // Yellow diff dot when true
  onToggle: () => void;
}

export function PermissionToggle({ operacao: _operacao, label, checked, disabled, changed, onToggle }: PermissionToggleProps) {
  return (
    <label className={cn(
      'flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/4',
      disabled && 'opacity-50 cursor-not-allowed',
      'relative',
    )}>
      <Switch
        checked={checked}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
        aria-label={`Permitir ${label}`}
      />
      <span className={cn('text-sm', !checked && 'text-muted-foreground/40')}>
        {label}
      </span>
      {changed && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" />
      )}
    </label>
  );
}
