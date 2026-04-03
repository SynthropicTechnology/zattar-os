'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { PageShell } from '@/components/shared/page-shell';
import { useDebounce } from '@/hooks/use-debounce';
import { useTribunais } from '@/app/(authenticated)/captura';
import { criarColunasTribunais } from '../components/tribunais/tribunais-columns';
import { TribunaisDialog } from '../components/tribunais/tribunais-dialog';
import { AdvogadosFilter } from '../components/advogados/advogados-filter';
import type { TribunalConfigDb as TribunalConfig } from '@/app/(authenticated)/captura';

const TIPO_ACESSO_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

export default function TribunaisPage() {
  const {
    tribunais,
    isLoading,
    error,
    refetch,
  } = useTribunais();

  // Table state for DataTableToolbar
  const [table, setTable] = useState<TanstackTable<TribunalConfig> | null>(null);
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [tipoAcessoFilter, setTipoAcessoFilter] = useState<string>('all');

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Estado do dialog
  const [tribunalDialog, setTribunalDialog] = useState<{
    open: boolean;
    tribunal: TribunalConfig | null;
  }>({
    open: false,
    tribunal: null,
  });

  // Handler para editar tribunal
  const handleEdit = useCallback((tribunal: TribunalConfig) => {
    setTribunalDialog({ open: true, tribunal });
  }, []);

  // Opções para filtros (extraídas dos dados)
  const tribunalOptions = useMemo(() => {
    const codigos = [...new Set(tribunais.map((t) => t.tribunal_codigo))].sort();
    return codigos.map((c) => ({ label: c, value: c }));
  }, [tribunais]);

  const tipoAcessoOptions = useMemo(() => {
    const tipos = [...new Set(tribunais.map((t) => t.tipo_acesso))].sort();
    return tipos.map((t) => ({ label: TIPO_ACESSO_LABELS[t] ?? t, value: t }));
  }, [tribunais]);

  // Filtrar tribunais
  const tribunaisFiltrados = useMemo(() => {
    return tribunais.filter((tribunal) => {
      // Filtro de busca
      if (buscaDebounced) {
        const buscaLower = buscaDebounced.toLowerCase();
        const match =
          tribunal.tribunal_codigo.toLowerCase().includes(buscaLower) ||
          tribunal.tribunal_nome.toLowerCase().includes(buscaLower) ||
          tribunal.url_base.toLowerCase().includes(buscaLower) ||
          tribunal.url_login_seam.toLowerCase().includes(buscaLower) ||
          tribunal.url_api.toLowerCase().includes(buscaLower);

        if (!match) return false;
      }

      // Filtro de código do tribunal
      if (tribunalFilter !== 'all' && tribunal.tribunal_codigo !== tribunalFilter) {
        return false;
      }

      // Filtro de tipo de acesso
      if (tipoAcessoFilter !== 'all' && tribunal.tipo_acesso !== tipoAcessoFilter) {
        return false;
      }

      return true;
    });
  }, [tribunais, buscaDebounced, tribunalFilter, tipoAcessoFilter]);

  const colunas = useMemo(
    () =>
      criarColunasTribunais({
        onEdit: handleEdit,
      }),
    [handleEdit]
  );

  return (
    <PageShell>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Tribunais"
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={setBusca}
              searchPlaceholder="Buscar tribunais..."
              actionButton={{
                label: 'Nova Configuração',
                onClick: () => setTribunalDialog({ open: true, tribunal: null }),
              }}
              filtersSlot={
                <>
                  <AdvogadosFilter
                    title="Tribunal"
                    options={tribunalOptions}
                    value={tribunalFilter}
                    onValueChange={setTribunalFilter}
                  />
                  <AdvogadosFilter
                    title="Grau"
                    options={tipoAcessoOptions}
                    value={tipoAcessoFilter}
                    onValueChange={setTipoAcessoFilter}
                  />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
      >
        <DataTable
          data={tribunaisFiltrados}
          columns={colunas}
          isLoading={isLoading}
          error={error}
          density={density}
          emptyMessage="Nenhuma configuração de tribunal encontrada."
          hidePagination={true}
          onTableReady={(t) => setTable(t as TanstackTable<TribunalConfig>)}
        />
      </DataShell>

      <TribunaisDialog
        tribunal={tribunalDialog.tribunal}
        open={tribunalDialog.open}
        onOpenChange={(open) => setTribunalDialog({ ...tribunalDialog, open })}
        onSuccess={() => {
          refetch();
          setTribunalDialog({ open: false, tribunal: null });
        }}
      />
    </PageShell>
  );
}
