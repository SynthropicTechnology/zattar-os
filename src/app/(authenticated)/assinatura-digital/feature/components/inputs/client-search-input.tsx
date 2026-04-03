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
    <div className={cn('space-y-2', className)}>
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
          className="shrink-0"
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

      {/* Status indicator */}
      {searchStatus === 'found' && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Cliente encontrado e preenchido automaticamente</span>
        </div>
      )}

      {searchStatus === 'notFound' && (
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <XCircle className="w-4 h-4" />
          <span>Cliente não encontrado. Preencha os dados manualmente.</span>
        </div>
      )}

      {searchStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="w-4 h-4" />
          <span>Erro ao buscar cliente. Tente novamente.</span>
        </div>
      )}
    </div>
  );
}
