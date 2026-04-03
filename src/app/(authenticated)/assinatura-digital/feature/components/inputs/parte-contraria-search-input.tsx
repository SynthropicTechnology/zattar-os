'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, Building2, User } from 'lucide-react';
import { searchPartesContrariasList } from '../../actions';
import type { ParteContrariaComEndereco } from '@/app/(authenticated)/partes/types';
import { cn } from '@/lib/utils';

export interface ParteContrariaSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onParteFound?: (parte: ParteContrariaComEndereco) => void;
  onParteNotFound?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  searchBy?: ('cpf' | 'cnpj' | 'nome')[];
}

export function ParteContrariaSearchInput({
  value = '',
  onChange,
  onParteFound,
  onParteNotFound,
  disabled = false,
  placeholder = 'Digite o nome, CPF ou CNPJ da parte contrária',
  className,
}: ParteContrariaSearchInputProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ParteContrariaComEndereco[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedParte, setSelectedParte] = useState<ParteContrariaComEndereco | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDocument = (parte: ParteContrariaComEndereco) => {
    if (parte.cnpj) {
      const c = parte.cnpj;
      return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
    }
    if (parte.cpf) {
      const c = parte.cpf;
      return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
    }
    return null;
  };

  const doSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchPartesContrariasList(term);
      if (response.success && response.data) {
        setResults(response.data);
        setShowDropdown(response.data.length > 0);
        setHighlightedIndex(-1);
        if (response.data.length === 0) {
          onParteNotFound?.();
        }
      }
    } catch {
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [onParteNotFound]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
    setSelectedParte(null);

    // Debounce de 300ms
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      doSearch(newValue);
    }, 300);
  };

  const handleSelect = (parte: ParteContrariaComEndereco) => {
    setSelectedParte(parte);
    setSearchValue(parte.nome);
    onChange?.(parte.nome);
    setShowDropdown(false);
    setResults([]);
    onParteFound?.(parte);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative space-y-2', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && !selectedParte) {
              setShowDropdown(true);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pr-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-64 overflow-auto py-1" role="listbox">
            {results.map((parte, index) => {
              const doc = formatDocument(parte);
              return (
                <li
                  key={parte.id}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm transition-colors',
                    highlightedIndex === index && 'bg-accent',
                    'hover:bg-accent'
                  )}
                  onClick={() => handleSelect(parte)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="mt-0.5 shrink-0">
                    {parte.tipo_pessoa === 'pj' ? (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{parte.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {parte.tipo_pessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      {doc && ` · ${doc}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sem resultados */}
      {showDropdown && results.length === 0 && !isSearching && searchValue.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            Nenhuma parte contrária encontrada. Preencha os dados manualmente.
          </p>
        </div>
      )}

      {/* Status de seleção */}
      {selectedParte && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Parte contrária selecionada: {selectedParte.nome}</span>
        </div>
      )}
    </div>
  );
}
