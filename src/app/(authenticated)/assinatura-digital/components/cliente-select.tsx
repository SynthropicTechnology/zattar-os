"use client";

import { useEffect, useState, useCallback } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronsUpDown, Check, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from '@/shared/assinatura-digital/utils';

interface ClienteOption {
  id: number | string;
  label: string;
  cpf?: string;
  cnpj?: string;
}

export interface ClienteSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  limit?: number;
}

export function ClienteSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um cliente",
  limit = 50,
}: ClienteSelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOptions = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (search && search.length >= 2) {
        params.set('search', search);
      }
      const response = await fetch(`/api/clientes/buscar/sugestoes?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data?.options) {
        setOptions(result.data.options);
      } else {
        setError(result.error || "Erro ao carregar clientes");
      }
    } catch {
      setError("Erro de conexão ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchOptions(searchQuery);
      } else if (searchQuery.length === 0) {
        fetchOptions();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, fetchOptions]);

  const selectedOption = options.find((opt) => Number(opt.id) === value);

  const formatDocument = (cpf?: string, cnpj?: string) => {
    if (cpf) return formatCpfCnpj(cpf);
    if (cnpj) return formatCpfCnpj(cnpj);
    return null;
  };

  if (loading && options.length === 0) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error && options.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => fetchOptions()}
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption ? (
              <>
                <User className="h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">{selectedOption.label}</span>
                {(selectedOption.cpf || selectedOption.cnpj) && (
                  <span className="text-xs text-muted-foreground">
                    ({formatDocument(selectedOption.cpf, selectedOption.cnpj)})
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
                "Digite pelo menos 2 caracteres para buscar"
              ) : (
                "Nenhum cliente encontrado"
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={String(opt.id)}
                  onSelect={() => {
                    onChange(Number(opt.id));
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === Number(opt.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">{opt.label}</span>
                    {(opt.cpf || opt.cnpj) && (
                      <span className="text-xs text-muted-foreground">
                        {formatDocument(opt.cpf, opt.cnpj)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
