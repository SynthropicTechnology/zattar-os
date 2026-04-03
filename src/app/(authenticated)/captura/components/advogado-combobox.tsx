'use client';

import { useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { Advogado } from '@/app/(authenticated)/advogados';
import { formatOabs } from '@/app/(authenticated)/advogados';

interface AdvogadoComboboxProps {
  advogados: Advogado[];
  selectedId: number | null;
  onSelectionChange: (advogadoId: number | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function AdvogadoCombobox({
  advogados,
  selectedId,
  onSelectionChange,
  disabled = false,
  isLoading = false,
  placeholder = 'Selecione um advogado',
}: AdvogadoComboboxProps) {
  const options: ComboboxOption[] = useMemo(() => {
    return advogados.map((advogado) => {
      // Formatar todas as OABs para exibição
      const oabsDisplay = formatOabs(advogado.oabs);

      // Texto de busca inclui todas as OABs
      const oabsSearch = (advogado.oabs ?? [])
        .map((oab) => `${oab.numero} ${oab.uf}`)
        .join(' ');

      return {
        value: advogado.id.toString(),
        label: `${advogado.nome_completo} - OAB ${oabsDisplay}`,
        searchText: `${advogado.nome_completo} ${oabsSearch} ${advogado.cpf}`,
      };
    });
  }, [advogados]);

  const handleValueChange = (values: string[]) => {
    if (values.length === 0) {
      onSelectionChange(null);
    } else {
      const id = parseInt(values[0], 10);
      onSelectionChange(isNaN(id) ? null : id);
    }
  };

  return (
    <Combobox
      options={options}
      value={selectedId ? [selectedId.toString()] : []}
      onValueChange={handleValueChange}
      placeholder={isLoading ? 'Carregando...' : placeholder}
      searchPlaceholder="Buscar advogado..."
      emptyText="Nenhum advogado encontrado."
      multiple={false}
      disabled={disabled || isLoading}
    />
  );
}
