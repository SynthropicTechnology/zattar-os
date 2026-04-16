'use client';

import * as React from 'react';
import { useState } from 'react';
import InputCPF from './input-cpf';
import { Button } from '@/components/ui/button';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { searchClienteByCPF } from '../../actions';
import type { Cliente } from '@/app/(authenticated)/partes/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ClientSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onClientFound?: (cliente: Cliente) => void;
  onClientNotFound?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ClientSearchInput({
  value = '',
  onChange,
  onClientFound,
  onClientNotFound,
  disabled = false,
  placeholder = 'Digite o CPF do cliente',
  className,
}: ClientSearchInputProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'notFound' | 'error'>('idle');

  const handleSearch = async () => {
    if (!searchValue || searchValue.trim().length === 0) {
      toast.error('Digite um CPF para buscar');
      return;
    }

    setIsSearching(true);
    setSearchStatus('idle');

    try {
      const result = await searchClienteByCPF(searchValue);

      if (!result.success) {
        setSearchStatus('error');
        toast.error(result.error || 'Erro ao buscar cliente');
        return;
      }

      if (result.data) {
        setSearchStatus('found');
        toast.success('Cliente encontrado!');
        onClientFound?.(result.data);
      } else {
        setSearchStatus('notFound');
        toast.info('Cliente não encontrado. Você pode cadastrar um novo cliente.');
        onClientNotFound?.();
      }
    } catch (error) {
      setSearchStatus('error');
      toast.error('Erro ao buscar cliente');
      console.error('Erro ao buscar cliente:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
    // Reset status quando o usuário digita
    if (searchStatus !== 'idle') {
      setSearchStatus('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && !isSearching) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <InputCPF
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSearching}
            placeholder={placeholder}
            className="w-full"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchValue || searchValue.trim().length === 0}
          size="default"
          className="h-11 shrink-0 shadow-[0_1px_2px_0_color-mix(in_oklch,black_8%,transparent),0_4px_16px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)] hover:shadow-[0_2px_4px_0_color-mix(in_oklch,black_10%,transparent),0_6px_24px_-4px_color-mix(in_oklch,var(--primary)_45%,transparent)] dark:shadow-[0_1px_2px_0_color-mix(in_oklch,black_40%,transparent),0_4px_20px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)] dark:hover:shadow-[0_2px_4px_0_color-mix(in_oklch,black_50%,transparent),0_6px_28px_-4px_color-mix(in_oklch,var(--primary)_65%,transparent)] transition-shadow"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* Status indicator — pills glass coerentes */}
      {searchStatus === 'found' && (
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 ring-1 ring-success/20">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
          <span className="text-xs font-medium text-success">
            Cliente encontrado — dados preenchidos
          </span>
        </div>
      )}

      {searchStatus === 'notFound' && (
        <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 ring-1 ring-warning/20">
          <XCircle className="h-3.5 w-3.5 text-warning" strokeWidth={2.5} />
          <span className="text-xs font-medium text-warning">
            Cliente não encontrado — preencha manualmente
          </span>
        </div>
      )}

      {searchStatus === 'error' && (
        <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 ring-1 ring-destructive/20">
          <XCircle className="h-3.5 w-3.5 text-destructive" strokeWidth={2.5} />
          <span className="text-xs font-medium text-destructive">
            Erro ao buscar — tente novamente
          </span>
        </div>
      )}
    </div>
  );
}
