'use client';

import { useMemo } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { GRAUS } from '@/app/(authenticated)/captura/constants';
import type { Credencial } from '@/app/(authenticated)/captura/types';

interface CredenciaisComboboxProps {
  credenciais: Credencial[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Extrai número do tribunal para ordenação
 * TRT1 = 1, TRT10 = 10, TST = 999 (fica no final)
 */
function extrairNumeroTribunal(tribunal: string): number {
  if (tribunal === 'TST') return 999;
  const match = tribunal.match(/TRT(\d+)/);
  return match ? parseInt(match[1], 10) : 998;
}

/**
 * Retorna peso do grau para ordenação
 * primeiro_grau = 1, segundo_grau = 2, tribunal_superior = 3
 */
function pesoGrau(grau: string): number {
  if (grau === 'primeiro_grau') return 1;
  if (grau === 'segundo_grau') return 2;
  if (grau === 'tribunal_superior') return 3;
  return 4;
}

/**
 * Ordena credenciais por número do tribunal (crescente) e depois por grau
 * Ordem: TRT1-1º, TRT1-2º, TRT2-1º, ..., TRT24-2º, TST-Tribunal Superior
 */
function ordenarCredenciais(credenciais: Credencial[]): Credencial[] {
  return [...credenciais].sort((a, b) => {
    // Primeiro ordenar por número do tribunal
    const numA = extrairNumeroTribunal(a.tribunal);
    const numB = extrairNumeroTribunal(b.tribunal);

    if (numA !== numB) {
      return numA - numB; // Ordem crescente: TRT1, TRT2, ..., TRT24, TST
    }

    // Se mesmo tribunal, ordenar por grau
    return pesoGrau(a.grau) - pesoGrau(b.grau);
  });
}

export function CredenciaisCombobox({
  credenciais,
  selectedIds,
  onSelectionChange,
  disabled = false,
  placeholder = 'Selecione credenciais...',
}: CredenciaisComboboxProps) {
  // Ordenar credenciais por número do TRT
  const credenciaisOrdenadas = useMemo(() => {
    return ordenarCredenciais(credenciais);
  }, [credenciais]);

  const options: ComboboxOption[] = useMemo(() => {
    return credenciaisOrdenadas.map((cred) => {
      const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
      const label = `${cred.tribunal} - ${grauLabel}`;
      
      return {
        value: cred.id.toString(),
        label,
        searchText: `${cred.tribunal} ${grauLabel} ${cred.grau}`,
      };
    });
  }, [credenciaisOrdenadas]);

  const handleValueChange = (values: string[]) => {
    const ids = values.map((v) => parseInt(v, 10)).filter((id) => !isNaN(id));
    onSelectionChange(ids);
  };

  return (
    <Combobox
      options={options}
      value={selectedIds.map((id) => id.toString())}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar credenciais..."
      emptyText="Nenhuma credencial encontrada."
      multiple={true}
      disabled={disabled}
      selectAllText="Selecionar todas"
      clearAllText="Limpar todas"
    />
  );
}
