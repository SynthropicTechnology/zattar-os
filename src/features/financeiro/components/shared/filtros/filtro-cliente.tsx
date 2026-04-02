'use client';

import { useState, useEffect, useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { actionListarClientes } from '@/app/app/partes/server-actions';
import type { Cliente } from '@/app/app/partes';

interface FiltroClienteProps {
  value: string;
  onChange: (value: string) => void;
  tipo: 'cliente' | 'fornecedor';
  placeholder?: string;
  className?: string;
}

export function FiltroCliente({
  value,
  onChange,
  tipo,
  placeholder,
  className = 'w-55',
}: FiltroClienteProps) {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultPlaceholder = tipo === 'cliente' ? 'Cliente' : 'Fornecedor';

  useEffect(() => {
    async function loadClientes() {
      setIsLoading(true);
      try {
        const result = await actionListarClientes({
          pagina: 1,
          limite: 100,
          ativo: true,
        });

        if (result.success && result.data) {
          const clientesOptions: ComboboxOption[] = result.data.data.map((cliente: Cliente) => {
            const documento = cliente.tipo_pessoa === 'pf' ? cliente.cpf : cliente.cnpj;
            return {
              value: String(cliente.id),
              label: cliente.nome,
              searchText: `${cliente.nome} ${documento || ''}`,
            };
          });

          setOptions([
            { value: '', label: tipo === 'cliente' ? 'Todos os clientes' : 'Todos os fornecedores' },
            ...clientesOptions,
          ]);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${tipo}s:`, error);
        setOptions([{ value: '', label: 'Erro ao carregar' }]);
      } finally {
        setIsLoading(false);
      }
    }

    loadClientes();
  }, [tipo]);

  const selectedValues = useMemo(() => (value ? [value] : []), [value]);

  const handleChange = (values: string[]) => {
    onChange(values[0] || '');
  };

  return (
    <Combobox
      options={options}
      value={selectedValues}
      onValueChange={handleChange}
      placeholder={isLoading ? 'Carregando...' : (placeholder || defaultPlaceholder)}
      searchPlaceholder={`Buscar ${tipo}...`}
      emptyText={`Nenhum ${tipo} encontrado`}
      multiple={false}
      disabled={isLoading}
      className={className}
    />
  );
}
