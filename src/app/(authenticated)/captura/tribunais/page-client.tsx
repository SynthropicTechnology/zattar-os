'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { SearchInput } from '@/components/dashboard/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Landmark, Settings, Plus, Lock, AlertTriangle, Clock } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useTribunais } from '@/app/(authenticated)/captura';
import { TribunaisDialog } from '../components/tribunais/tribunais-dialog';
import { AdvogadosFilter } from '../components/advogados/advogados-filter';
import type { TribunalConfigDb as TribunalConfig } from '@/app/(authenticated)/captura';
import { useCredenciaisMap } from '../hooks/use-credenciais-map';

const TIPO_ACESSO_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

export default function TribunaisPage() {
  const {
    tribunais,
    isLoading,
    error: _error,
    refetch,
  } = useTribunais();

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

  // Credenciais map for enriching tribunal cards
  const { credenciaisMap } = useCredenciaisMap();

  // Count credenciais per tribunal
  const credenciaisPorTribunal = useMemo(() => {
    const counts = new Map<string, number>();
    credenciaisMap.forEach((info) => {
      const current = counts.get(info.tribunal) ?? 0;
      counts.set(info.tribunal, current + 1);
    });
    return counts;
  }, [credenciaisMap]);

  // Tribunais with credenciais vs without
  const tribunaisComCredenciais = useMemo(() => {
    return tribunais.filter((t) => (credenciaisPorTribunal.get(t.tribunal_codigo) ?? 0) > 0).length;
  }, [tribunais, credenciaisPorTribunal]);

  // KPI items — aligned with mock: Configurados, Com Credenciais, Sem Cobertura
  const kpiItems = useMemo<PulseItem[]>(() => {
    const semCobertura = tribunais.length - tribunaisComCredenciais;
    return [
      { label: 'Configurados', total: tribunais.length, icon: Landmark, color: 'text-primary' },
      { label: 'Com Credenciais', total: tribunaisComCredenciais, icon: Lock, color: 'text-success' },
      { label: 'Sem Cobertura', total: semCobertura, icon: AlertTriangle, color: 'text-warning' },
    ];
  }, [tribunais, tribunaisComCredenciais]);

  return (
    <>
      <div className="space-y-5">
        {/* KPI Strip */}
        <PulseStrip items={kpiItems} />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar tribunais..." />
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Card Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tribunaisFiltrados.map((tribunal) => (
              <div
                key={tribunal.id}
                className="cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all duration-200"
                onClick={() => handleEdit(tribunal)}
              >
              <GlassPanel
                depth={2}
                className="p-4 h-full"
              >
                {/* Header: Acronym + Name + Grau badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-primary font-heading leading-none">
                      {tribunal.tribunal_codigo}
                    </div>
                    <div className="text-xs text-muted-foreground/55 mt-1 truncate">
                      {tribunal.tribunal_nome}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] border border-border/15 bg-muted/20 text-muted-foreground shrink-0">
                    {TIPO_ACESSO_LABELS[tribunal.tipo_acesso] ?? tribunal.tipo_acesso}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border/10 my-2" />

                {/* Meta rows */}
                <div className="space-y-1.5">
                  {/* Status */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(credenciaisPorTribunal.get(tribunal.tribunal_codigo) ?? 0) > 0 ? 'bg-success' : 'bg-warning'}`} />
                    <span className="text-muted-foreground/70">
                      {(credenciaisPorTribunal.get(tribunal.tribunal_codigo) ?? 0) > 0 ? 'Ativo' : 'Sem cobertura'}
                    </span>
                  </div>

                  {/* Credenciais count */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <Lock className="size-3 opacity-50 shrink-0" />
                    <span>Credenciais: <strong className="text-foreground font-medium">{credenciaisPorTribunal.get(tribunal.tribunal_codigo) ?? 0}</strong></span>
                  </div>

                  {/* URL base (truncated) */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <Clock className="size-3 opacity-50 shrink-0" />
                    <span className="truncate max-w-40" title={tribunal.url_base}>
                      {tribunal.url_base.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="border-t border-border/10 mt-3 pt-3">
                  {(credenciaisPorTribunal.get(tribunal.tribunal_codigo) ?? 0) > 0 ? (
                    <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-primary">
                      <Settings className="size-3 mr-1" />
                      Configurar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-warning">
                      <Plus className="size-3 mr-1" />
                      Adicionar Credencial
                    </Button>
                  )}
                </div>
              </GlassPanel>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tribunaisFiltrados.length === 0 && (
          <EmptyState
            icon={Landmark}
            title="Nenhum tribunal encontrado"
            description="Ajuste os filtros ou cadastre uma nova configuração."
          />
        )}
      </div>

      <TribunaisDialog
        tribunal={tribunalDialog.tribunal}
        open={tribunalDialog.open}
        onOpenChange={(open) => setTribunalDialog({ ...tribunalDialog, open })}
        onSuccess={() => {
          refetch();
          setTribunalDialog({ open: false, tribunal: null });
        }}
      />
    </>
  );
}
